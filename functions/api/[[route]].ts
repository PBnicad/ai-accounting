import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { drizzle } from 'drizzle-orm/d1';
import { users, sessions, transactions } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Bindings = {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GLM_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware to inject DB
app.use('*', async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set('db', db);
  await next();
});

type Variables = {
  db: ReturnType<typeof drizzle>;
  user: typeof users.$inferSelect | null;
};

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Auth Middleware for protected routes
const authMiddleware = async (c: any, next: any) => {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) {
    c.set('user', null);
    return next();
  }

  const db = drizzle(c.env.DB);
  const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  const session = result[0];

  if (!session || session.expiresAt < new Date()) {
    c.set('user', null);
    return next();
  }

  const userResult = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  c.set('user', userResult[0] || null);
  await next();
};

api.use('*', authMiddleware);

api.get('/auth/login', (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  const url = new URL(c.req.url);
  const redirectUri = `${url.origin}/api/auth/callback`;
  return c.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user`);
});

api.get('/auth/callback', async (c) => {
  const code = c.req.query('code');
  const clientId = c.env.GITHUB_CLIENT_ID;
  const clientSecret = c.env.GITHUB_CLIENT_SECRET;

  if (!code) return c.json({ error: 'No code provided' }, 400);

  // Exchange code for token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenResponse.json() as any;
  if (tokenData.error) return c.json({ error: tokenData.error }, 400);

  const accessToken = tokenData.access_token;

  // Get User Info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Cloudflare-Workers',
    },
  });

  const userData = await userResponse.json() as any;
  
  const db = drizzle(c.env.DB);
  
  // Check if user exists
  let user = await db.select().from(users).where(eq(users.githubId, userData.id.toString())).get();

  if (!user) {
    // Create user
    const userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      githubId: userData.id.toString(),
      username: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
    });
    user = await db.select().from(users).where(eq(users.id, userId)).get();
  }

  if (!user) return c.json({ error: 'Failed to create user' }, 500);

  // Create Session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  const url = new URL(c.req.url);
  const isSecure = url.protocol === 'https:';

  setCookie(c, 'session_id', sessionId, {
    path: '/',
    secure: isSecure,
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'Lax',
  });

  return c.redirect('/dashboard');
});

api.get('/auth/me', (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ user: null });
  }
  return c.json({ user });
});

api.post('/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id');
  if (sessionId) {
    const db = drizzle(c.env.DB);
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    deleteCookie(c, 'session_id');
  }
  return c.json({ success: true });
});

// --- Transaction Routes ---

const transactionSchema = z.object({
  amount: z.number(),
  type: z.enum(['EXPENSE', 'INCOME']),
  category: z.string(),
  description: z.string(),
  date: z.string(), // YYYY-MM-DD
  createdAt: z.number().optional(),
});

api.get('/transactions', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const db = drizzle(c.env.DB);
  const result = await db.select()
    .from(transactions)
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
  
  return c.json(result);
});

api.post('/transactions', zValidator('json', transactionSchema), async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);
  const id = crypto.randomUUID();

  await db.insert(transactions).values({
    id,
    userId: user.id,
    ...data,
    createdAt: data.createdAt || Date.now(),
  });

  const newTransaction = await db.select().from(transactions).where(eq(transactions.id, id)).get();
  return c.json(newTransaction);
});

api.put('/transactions/:id', zValidator('json', transactionSchema), async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);

  // Verify ownership
  const existing = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, user.id))).get();
  if (!existing) return c.json({ error: 'Transaction not found' }, 404);

  await db.update(transactions)
    .set({
      ...data,
    })
    .where(eq(transactions.id, id));

  const updated = await db.select().from(transactions).where(eq(transactions.id, id)).get();
  return c.json(updated);
});

api.delete('/transactions/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const db = drizzle(c.env.DB);

  // Verify ownership
  const existing = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, user.id))).get();
  if (!existing) return c.json({ error: 'Transaction not found' }, 404);

  await db.delete(transactions).where(eq(transactions.id, id));
  return c.json({ success: true });
});

// --- AI Parsing Routes ---

const ALL_CATEGORIES = [
  "餐饮", "交通", "购物", "娱乐", "居住", 
  "医疗", "教育", "工作", "理财", "其他",
  "工资", "奖金", "兼职", "投资", "红包"
];



const getCommonPrompt = () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' });

  return `
    Current Date: ${todayStr} (${weekday}).
    
    Task: Extract transaction details.
    1. Default to current date if not specified.
    2. Calculate exact YYYY-MM-DD for relative dates like "yesterday".
    3. Infer amounts logically.
    4. Category MUST be one of: ${ALL_CATEGORIES.join(', ')}.
  `;
};

api.post('/ai/parse', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { input, image, mimeType } = await c.req.json<{ input?: string; image?: string; mimeType?: string }>();
  
  if (!input && !image) return c.json({ error: 'No input provided' }, 400);

  const apiKey = c.env.GLM_API_KEY;
  if (!apiKey) return c.json({ error: 'Server configuration error' }, 500);

  const messages: any[] = [
    {
      role: 'system',
      content: `${getCommonPrompt()}\nPlease return the result in JSON format directly. Example: [{"type": "EXPENSE", "amount": 45.00, "category": "餐饮", "date": "2025-12-03", "description": "Lunch"}]`
    }
  ];

  let model = 'glm-4-flash';

  if (image && mimeType) {
    model = 'glm-4v-flash';
    const base64Data = image.split(',')[1] || image;
    
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this receipt image and extract transaction details.' },
        { type: 'image_url', image_url: { url: base64Data } }
      ]
    });
  } else {
    messages.push({
      role: 'user',
      content: input
    });
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.1,
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('GLM Error:', errText);
        return c.json({ error: 'AI Service Error' }, 500);
    }

    const data: any = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) return c.json({ error: 'No data returned from AI' }, 500);

    // Clean content
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        console.error("JSON Parse Error", e);
        return c.json({ error: 'Invalid JSON from AI' }, 500);
    }
    
    return c.json(parsed);

  } catch (error) {
    console.error("AI Parsing Error:", error);
    return c.json({ error: 'AI Parsing failed' }, 500);
  }
});

app.route('/api', api);

export const onRequest = handle(app);
