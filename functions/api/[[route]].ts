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

// --- AI Report Route ---

const getDateRange = (type: 'weekly' | 'monthly', dateStr: string) => {
  const date = new Date(dateStr);
  // Reset to start of day to avoid timezone shifts causing issues if not handled carefully, 
  // but for "local time" logic, we just need to find the boundary dates.
  // We will return YYYY-MM-DD strings.
  
  let start = new Date(date);
  let end = new Date(date);

  if (type === 'weekly') {
    // Monday as start
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    end.setDate(start.getDate() + 6);
  } else {
    // Start of month
    start.setDate(1);
    // End of month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
  }
  
  return { 
    startStr: start.toISOString().split('T')[0], 
    endStr: end.toISOString().split('T')[0] 
  };
};

api.post('/ai/report', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { type, date } = await c.req.json<{ type: 'weekly' | 'monthly', date: string }>();
  
  if (!['weekly', 'monthly'].includes(type) || !date) {
    return c.json({ error: 'Invalid parameters' }, 400);
  }

  const { startStr, endStr } = getDateRange(type, date);

  const db = drizzle(c.env.DB);
  
  // Fetch all user transactions (optimizable later with date filtering in SQL)
  const allTransactions = await db.select()
    .from(transactions)
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.date));
    
  // Filter in JS
  const periodTransactions = allTransactions.filter(t => t.date >= startStr && t.date <= endStr);

  if (periodTransactions.length === 0) {
     return c.json({ report: '该时间段内没有记账记录，无法生成报告。请先记几笔账吧！' });
  }

  // Aggregate Data
  const totalIncome = periodTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = periodTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  
  const categoryStats: Record<string, number> = {};
  periodTransactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    categoryStats[t.category] = (categoryStats[t.category] || 0) + t.amount;
  });
  
  const topCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amount]) => `${cat}: ${amount.toFixed(2)}`)
    .join(', ');

  const prompt = `
    角色: 专业的理财顾问 (AI 记账助手)。
    任务: 为用户生成一份${type === 'weekly' ? '周' : '月'}度财务报告。
    语言: 必须使用简体中文 (Simplified Chinese)。
    语调: 专业、鼓励、乐于助人，带一点幽默感 (复古风格)。

    数据:
    - 时间段: ${startStr} 至 ${endStr}
    - 总收入: ${totalIncome.toFixed(2)}
    - 总支出: ${totalExpense.toFixed(2)}
    - 净结余: ${balance.toFixed(2)}
    - 支出最高的类别: ${topCategories || '无'}
    - 交易笔数: ${periodTransactions.length}

    要求:
    1. **总览**: 简要总结财务状况。
    2. **分析**: 分析消费习惯。用户是否在某些类别上花费过多？
    3. **建议**: 基于数据给出3条具体、可执行的省钱或理财建议。
    4. **格式**: 使用 Markdown (加粗, 列表) 以提高可读性。不要输出 JSON。直接输出 Markdown 文本。
  `;

  // Call AI
  const apiKey = c.env.GLM_API_KEY;
  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [
              { role: 'system', content: '你是一位专业的理财顾问。请始终使用简体中文回答。' },
              { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        })
      });

      const data: any = await response.json();
      let content = data.choices?.[0]?.message?.content;

      if (!content) return c.json({ error: 'Failed to generate report' }, 500);

      // Clean markdown code blocks
      content = content.replace(/```markdown\n?/g, '').replace(/```\n?/g, '').trim();

      return c.json({ report: content });
  } catch (error) {
      console.error("AI Report Error:", error);
      return c.json({ error: 'AI Service Failed' }, 500);
  }
});

app.route('/api', api);

export const onRequest = handle(app);
