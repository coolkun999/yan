const express = require('express');
const jwt = require('jsonwebtoken');
const { all, get, run } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'yan-secret-key-change-in-production';

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } catch (e) { /* 忽略 */ }
  }
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token 无效' });
  }
}

// ===== 获取用户主页 =====
router.get('/:handle', optionalAuth, (req, res) => {
  const handle = req.params.handle.startsWith('@') ? req.params.handle : '@' + req.params.handle;

  const user = get('SELECT id, name, handle, bio, location, avatar_bg, verified, created_at FROM users WHERE handle = ?', [handle]);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const followers = get('SELECT COUNT(*) as c FROM follows WHERE following_id = ?', [user.id])?.c || 0;
  const following = get('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?', [user.id])?.c || 0;
  const postsCount = get('SELECT COUNT(*) as c FROM posts WHERE user_id = ?', [user.id])?.c || 0;

  let isFollowing = false;
  if (req.userId) {
    const f = get('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.userId, user.id]);
    isFollowing = !!f;
  }

  res.json({ ...user, followers, following, posts: postsCount, isFollowing });
});

// ===== 获取用户的帖子 =====
router.get('/:handle/posts', optionalAuth, (req, res) => {
  const handle = req.params.handle.startsWith('@') ? req.params.handle : '@' + req.params.handle;
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  const user = get('SELECT id FROM users WHERE handle = ?', [handle]);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const posts = all(`
    SELECT p.*, u.name, u.handle, u.avatar_bg, u.verified
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `, [user.id, limit, page * limit]);

  if (req.userId) {
    const likedPosts = all('SELECT post_id FROM likes WHERE user_id = ?', [req.userId]);
    const likedSet = new Set(likedPosts.map(l => l.post_id));
    posts.forEach(p => { p.liked = likedSet.has(p.id); });
  }

  res.json({ posts });
});

// ===== 关注/取消关注 =====
router.post('/:handle/follow', requireAuth, (req, res) => {
  const handle = req.params.handle.startsWith('@') ? req.params.handle : '@' + req.params.handle;

  const user = get('SELECT id FROM users WHERE handle = ?', [handle]);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  if (user.id === req.userId) {
    return res.status(400).json({ error: '不能关注自己' });
  }

  const existing = get('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.userId, user.id]);

  if (existing) {
    run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.userId, user.id]);
    res.json({ following: false });
  } else {
    run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.userId, user.id]);
    res.json({ following: true });
  }
});

// ===== 搜索用户 =====
router.get('/search/:keyword', (req, res) => {
  const keyword = '%' + req.params.keyword + '%';
  const users = all('SELECT id, name, handle, bio, avatar_bg, verified FROM users WHERE name LIKE ? OR handle LIKE ? LIMIT 20', [keyword, keyword]);
  res.json(users);
});

module.exports = router;
