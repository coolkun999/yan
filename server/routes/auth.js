const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { all, get, run } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'yan-secret-key-change-in-production';
const TOKEN_EXPIRE = '7d';

// ===== 注册 =====
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: '请填写所有必填项' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' });
  }

  // 检查邮箱是否已注册
  const existing = get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ error: '该邮箱已注册' });
  }

  // 生成 handle
  const handle = '@' + name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    run('INSERT INTO users (name, handle, email, password_hash) VALUES (?, ?, ?, ?)', [name, handle, email, passwordHash]);
    // 通过 email 查询刚插入的用户（sql.js 的 last_insert_rowid 有问题）
    const user = get('SELECT id, name, handle, email, bio, location, avatar_bg, verified, created_at FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(500).json({ error: '注册失败：无法创建用户' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

// ===== 登录 =====
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '请输入邮箱和密码' });
  }

  const user = get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// ===== 获取当前用户 =====
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = get('SELECT id, name, handle, email, bio, location, avatar_bg, verified, created_at FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const followers = get('SELECT COUNT(*) as c FROM follows WHERE following_id = ?', [user.id])?.c || 0;
    const following = get('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?', [user.id])?.c || 0;
    const postsCount = get('SELECT COUNT(*) as c FROM posts WHERE user_id = ?', [user.id])?.c || 0;

    res.json({ ...user, followers, following, posts: postsCount });
  } catch (err) {
    res.status(401).json({ error: 'Token 无效' });
  }
});

module.exports = router;
