const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(cors({
  origin: ['https://www.kunshagj.com', 'https://kunshagj.com', 'http://localhost:8080', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (!req.path.startsWith('/api/')) return;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ===== API 路由 =====
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  const { all } = require('./db');
  try {
    const userCount = all('SELECT COUNT(*) as c FROM users');
    const postCount = all('SELECT COUNT(*) as c FROM posts');
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      version: '1.0.0',
      stats: {
        users: userCount[0]?.c || 0,
        posts: postCount[0]?.c || 0
      }
    });
  } catch (err) {
    res.json({ status: 'ok', time: new Date().toISOString(), version: '1.0.0' });
  }
});

// ===== 静态文件服务（开发模式）=====
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '..')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  });
}

// ===== 错误处理 =====
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({ error: '服务器内部错误' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// ===== 启动 =====
async function start() {
  try {
    await initDB();
    console.log('[DB] 数据库就绪');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n=== 言 (Yan) 后端服务 ===`);
      console.log(`端口: ${PORT}`);
      console.log(`API:  http://localhost:${PORT}/api`);
      console.log(`健康: http://localhost:${PORT}/api/health`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`时间: ${new Date().toISOString()}\n`);
    });
  } catch (err) {
    console.error('[FATAL] 启动失败:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
