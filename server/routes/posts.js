const express = require('express');
const jwt = require('jsonwebtoken');
const { all, get, run } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'yan-secret-key-change-in-production';

// 可选认证
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

// 强制认证
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

// ===== 获取帖子列表 =====
router.get('/', optionalAuth, (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const offset = page * limit;

  const posts = all(`
    SELECT p.*, u.name, u.handle, u.avatar_bg, u.verified
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  // 标记是否已点赞
  if (req.userId) {
    const likedPosts = all('SELECT post_id FROM likes WHERE user_id = ?', [req.userId]);
    const likedSet = new Set(likedPosts.map(l => l.post_id));
    posts.forEach(p => { p.liked = likedSet.has(p.id); });
  }

  const total = get('SELECT COUNT(*) as c FROM posts')?.c || 0;
  const hasMore = offset + limit < total;

  res.json({ posts, hasMore, total });
});

// ===== 获取单个帖子 =====
router.get('/:id', optionalAuth, (req, res) => {
  const post = get(`
    SELECT p.*, u.name, u.handle, u.avatar_bg, u.verified
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [parseInt(req.params.id)]);

  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  const replies = all(`
    SELECT r.*, u.name, u.handle, u.avatar_bg, u.verified
    FROM replies r
    JOIN users u ON r.user_id = u.id
    WHERE r.post_id = ?
    ORDER BY r.created_at DESC
  `, [parseInt(req.params.id)]);

  if (req.userId) {
    const likedPosts = all('SELECT post_id FROM likes WHERE user_id = ?', [req.userId]);
    const likedSet = new Set(likedPosts.map(l => l.post_id));
    post.liked = likedSet.has(post.id);
  }

  res.json({ post, replies });
});

// ===== 发帖 =====
router.post('/', requireAuth, (req, res) => {
  const { content, media } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '帖子内容不能为空' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: '帖子内容不能超过 2000 字' });
  }

  try {
    run('INSERT INTO posts (user_id, content, media) VALUES (?, ?, ?)', [req.userId, content.trim(), JSON.stringify(media || [])]);
    // 查询刚插入的帖子
    const post = get(`
      SELECT p.*, u.name, u.handle, u.avatar_bg, u.verified
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ? AND p.content = ?
      ORDER BY p.created_at DESC
      LIMIT 1
    `, [req.userId, content.trim()]);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: '发帖失败: ' + err.message });
  }
});

// ===== 删帖 =====
router.delete('/:id', requireAuth, (req, res) => {
  const post = get('SELECT * FROM posts WHERE id = ?', [parseInt(req.params.id)]);

  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }
  if (post.user_id !== req.userId) {
    return res.status(403).json({ error: '只能删除自己的帖子' });
  }

  run('DELETE FROM likes WHERE post_id = ?', [parseInt(req.params.id)]);
  run('DELETE FROM replies WHERE post_id = ?', [parseInt(req.params.id)]);
  run('DELETE FROM posts WHERE id = ?', [parseInt(req.params.id)]);

  res.json({ success: true });
});

// ===== 点赞/取消点赞 =====
router.post('/:id/like', requireAuth, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = get('SELECT * FROM posts WHERE id = ?', [postId]);

  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  const existing = get('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [req.userId, postId]);

  if (existing) {
    run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.userId, postId]);
    run('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?', [postId]);
    res.json({ liked: false, likes_count: post.likes_count - 1 });
  } else {
    run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.userId, postId]);
    run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
    res.json({ liked: true, likes_count: post.likes_count + 1 });
  }
});

// ===== 回复帖子 =====
router.post('/:id/reply', requireAuth, (req, res) => {
  const { content } = req.body;
  const postId = parseInt(req.params.id);

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '回复内容不能为空' });
  }

  const post = get('SELECT * FROM posts WHERE id = ?', [postId]);
  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  try {
    run('INSERT INTO replies (post_id, user_id, content) VALUES (?, ?, ?)', [postId, req.userId, content.trim()]);
    run('UPDATE posts SET replies_count = replies_count + 1 WHERE id = ?', [postId]);

    // 查询刚插入的回复
    const reply = get(`
      SELECT r.*, u.name, u.handle, u.avatar_bg, u.verified
      FROM replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.post_id = ? AND r.user_id = ? AND r.content = ?
      ORDER BY r.created_at DESC
      LIMIT 1
    `, [postId, req.userId, content.trim()]);

    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: '回复失败: ' + err.message });
  }
});

module.exports = router;
