const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'yan.db');

let db = null;

// 初始化数据库
async function initDB() {
  const SQL = await initSqlJs();
  
  // 尝试加载现有数据库
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      bio TEXT DEFAULT '',
      location TEXT DEFAULT '',
      avatar_bg TEXT DEFAULT 'linear-gradient(135deg,#667eea,#764ba2)',
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      media TEXT DEFAULT '[]',
      likes_count INTEGER DEFAULT 0,
      retweets_count INTEGER DEFAULT 0,
      replies_count INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 种子数据
  seedData();
  
  // 保存数据库
  saveDB();
  
  console.log('[DB] 数据库初始化完成');
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// 辅助函数：查询多行
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// 辅助函数：查询单行
function get(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

// 辅助函数：执行 INSERT/UPDATE/DELETE
function run(sql, params = []) {
  // 执行 SQL
  if (params.length > 0) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
  } else {
    db.run(sql);
  }
  saveDB();
  // 获取最后插入的 ID
  try {
    const result = db.exec('SELECT last_insert_rowid() as id');
    if (result.length > 0 && result[0].values.length > 0) {
      return { lastInsertRowid: result[0].values[0][0] };
    }
  } catch(e) {}
  return { lastInsertRowid: 0 };
}

function seedData() {
  const userCount = all('SELECT COUNT(*) as c FROM users');
  if (userCount[0]?.c > 0) return;

  console.log('[DB] 初始化种子数据...');
  const hash = bcrypt.hashSync('123456', 10);

  const users = [
    ['林小雨', '@linxiaoyu', 'lin@example.com', hash, 'AI 爱好者，科技博主', '北京', 'linear-gradient(135deg,#667eea,#764ba2)', 1],
    ['科技日报', '@techdaily', 'tech@example.com', hash, '科技新闻第一手资讯', '上海', 'linear-gradient(135deg,#f093fb,#f5576c)', 1],
    ['创业老王', '@chuangyelaowang', 'wang@example.com', hash, '创业三年，踩坑无数', '深圳', 'linear-gradient(135deg,#4facfe,#00f2fe)', 0],
    ['摄影师阿明', '@photographer_aming', 'aming@example.com', hash, '用镜头记录世界', '成都', 'linear-gradient(135deg,#43e97b,#38f9d7)', 0],
    ['王坤', '@wangkun', 'wangkun2099@gmail.com', hash, '言的开发者', '中国 湖北', 'linear-gradient(135deg,#667eea,#764ba2)', 0],
  ];

  for (const u of users) {
    run('INSERT INTO users (name, handle, email, password_hash, bio, location, avatar_bg, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', u);
  }

  const posts = [
    [1, '今天用 AI 写了一段代码，效率提升了三倍。以前需要半天的工作，现在一小时搞定。技术真的在改变我们的工作方式 🚀', 1024, 238, 56, 83000],
    [2, '【重磅】国内首款自研芯片正式量产，性能超越国际同类产品20%。这标志着我国在半导体领域取得重大突破。', 5820, 2341, 428, 420000],
    [3, '创业第三年的感悟：\n\n1. 找到真正的痛点比找资金更重要\n2. 团队比产品更关键\n3. 现金流是命脉\n4. 不要追风口，要做有价值的事\n5. 失败是最好的老师', 892, 445, 103, 61000],
    [4, '早晨六点的城市，属于少数清醒的人。', 3201, 189, 67, 150000],
    [5, '我在中国 我是中国人，有没有交朋友', 3, 0, 3, 98],
  ];

  for (const p of posts) {
    run('INSERT INTO posts (user_id, content, likes_count, retweets_count, replies_count, views_count) VALUES (?, ?, ?, ?, ?, ?)', p);
  }

  console.log('[DB] 种子数据初始化完成！5 个用户，5 条帖子');
}

// 导出
module.exports = { initDB, all, get, run, saveDB };
