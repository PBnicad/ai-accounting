import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PieChart, Shield, Zap, Github, Wallet, Coffee, ShoppingCart, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed', error);
      }
    };
    checkAuth();
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      window.location.href = '/api/auth/login';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-retro-bg text-black overflow-hidden font-fredoka">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-2xl font-bold flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-retro-accent border-2 border-black rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          AI 记账
        </motion.div>
        <motion.button
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAction}
          className="retro-btn px-6 py-2 bg-white font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          {isAuthenticated ? (
            '进入控制台'
          ) : (
            <>
              <Github className="w-5 h-5" />
              GitHub 登录
            </>
          )}
        </motion.button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-black leading-tight">
              让记账变得 <br />
              <span className="text-retro-accent inline-block transform -rotate-2 decoration-4 underline decoration-black">简单又有趣</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-lg">
              AI 驱动的智能记账助手，自动分类，图表分析，让你的每一分钱都清晰可见。
            </motion.p>
            <motion.div variants={itemVariants} className="flex gap-4">
              <button 
                onClick={handleAction}
                className="retro-btn px-8 py-4 bg-retro-accent text-lg font-bold rounded-xl flex items-center gap-2 hover:bg-yellow-400"
              >
                {isAuthenticated ? '进入控制台' : '立即开始'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>

          {/* Hero Image / Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: 5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="relative"
          >
            <div className="retro-card p-8 bg-white rotate-2 z-10 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">本月支出</h3>
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-black">
                  - ¥ 3,240
                </span>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 border-2 border-gray-100 rounded-lg hover:border-black transition-colors">
                    <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center ${i === 1 ? 'bg-blue-200' : i === 2 ? 'bg-green-200' : 'bg-purple-200'}`}>
                      {i === 1 ? <Coffee className="w-5 h-5 text-black" /> : i === 2 ? <ShoppingCart className="w-5 h-5 text-black" /> : <Gamepad2 className="w-5 h-5 text-black" />}
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-16"></div>
                    </div>
                    <div className="font-bold">¥ {i * 100 + 50}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-400 rounded-full border-2 border-black -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-400 rounded-full border-2 border-black -z-10"></div>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard 
            icon={<Zap className="w-8 h-8" />}
            title="AI 智能识别"
            desc="只需输入自然语言，自动解析金额、分类和日期。"
            color="bg-purple-200"
          />
          <FeatureCard 
            icon={<PieChart className="w-8 h-8" />}
            title="可视化报表"
            desc="直观的图表展示，让你的收支状况一目了然。"
            color="bg-green-200"
          />
          <FeatureCard 
            icon={<Shield className="w-8 h-8" />}
            title="安全存储"
            desc="数据云端加密存储，随时随地访问你的账本。"
            color="bg-blue-200"
          />
        </motion.div>
      </main>
      
      <footer className="border-t-2 border-black py-8 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 flex flex-col items-center gap-2">
          <div>© 2025 AI 记账. Built with ❤️ and Hono.</div>
          <a 
            href="https://github.com/PBnicad/ai-accounting" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className={`retro-card p-6 ${color}`}
  >
    <div className="w-16 h-16 bg-white border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-700">{desc}</p>
  </motion.div>
);

export default LandingPage;
