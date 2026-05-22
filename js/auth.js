// ===== AUTH SYSTEM: 账号系统 =====
// 支持：手机+验证码登录/注册、邮箱+密码登录/注册、游客模式
// 数据存储在 localStorage，模拟后端

const AUTH_KEY = 'yan_auth_users';
const SESSION_KEY = 'yan_current_user';

// ===== 本地“数据库”操作 =====
function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || {}; } catch(e) { return {}; }
}
function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) { return null; }
}
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ===== 工具函数 =====
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPassword(pw) {
  return pw.length >= 8;
}
function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 模拟发送验证码（localStorage 暂存，实际显示给用户）
const CODE_KEY = 'yan_verify_codes';
function getCodes() {
  try { return JSON.parse(localStorage.getItem(CODE_KEY)) || {}; } catch(e) { return {}; }
}
function saveCodes(codes) {
  localStorage.setItem(CODE_KEY, JSON.stringify(codes));
}
function sendVerifyCode(phoneOrEmail) {
  const code = genCode();
  const codes = getCodes();
  codes[phoneOrEmail] = { code: code, expires: Date.now() + 5 * 60 * 1000 }; // 5分钟有效
  saveCodes(codes);
  // 模拟：在真实环境这里会发短信/邮件，这里显示在页面顶部方便测试
  showVerifyCode(phoneOrEmail, code);
  return code;
}

// 在页面顶部显示验证码（开发测试用）
function showVerifyCode(identifier, code) {
  // 移除旧提示
  const old = document.getElementById('devCodeTip');
  if (old) old.remove();
  const tip = document.createElement('div');
  tip.id = 'devCodeTip';
  tip.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#1d9bf0;color:#fff;text-align:center;padding:8px 16px;font-size:14px;font-weight:600;letter-spacing:1px';
  tip.innerHTML = '📱 测试验证码：<b style="font-size:18px;margin:0 4px">' + code + '</b> （发送给 ' + identifier + '）— 正式环境此处为发送短信/邮件';
  document.body.appendChild(tip);
  // 30秒后自动消失
  setTimeout(function(){ if(tip.parentNode) tip.remove(); }, 30000);
}
function verifyCode(phoneOrEmail, inputCode) {
  const codes = getCodes();
  const rec = codes[phoneOrEmail];
  if (!rec) return false;
  if (Date.now() > rec.expires) { delete codes[phoneOrEmail]; saveCodes(codes); return false; }
  if (rec.code !== inputCode) return false;
  delete codes[phoneOrEmail];
  saveCodes(codes);
  return true;
}

// ===== 注册 =====
function authRegister(identifier, password, type, displayName) {
  // identifier: 手机号或邮箱, type: 'phone'|'email', displayName: 可选昵称
  const users = getUsers();
  if (users[identifier]) return { ok: false, msg: '该账号已注册，请直接登录' };
  const handle = genHandle(identifier);
  let name;
  if (displayName && displayName.trim()) {
    name = displayName.trim();
  } else if (type === 'phone') {
    name = '用户' + identifier.slice(-4);
  } else {
    name = identifier.split('@')[0];
  }
  const user = {
    identifier,
    type, // 'phone' | 'email'
    password, // 注意：纯前端不安全，仅作演示
    handle: handle,
    name: name,
    bio: '',
    location: '',
    website: '',
    avatar: null,
    avatarBg: randomGradient(),
    verified: false,
    role: 'user',
    followers: 0,
    following: 0,
    posts: 0,
    liked: 0,
    joinedDate: new Date().toISOString().slice(0, 10),
    createdAt: Date.now()
  };
  users[identifier] = user;
  saveUsers(users);
  // 注册成功自动登录（建立 session，脱敏存储）
  const sessionUser = { ...user };
  delete sessionUser.password;
  setSession(sessionUser);
  return { ok: true, user: sessionUser };
}

// ===== 登录 =====
function authLogin(identifier, credential, type) {
  // type: 'phone'（验证码）| 'email'（密码）
  const users = getUsers();
  const user = users[identifier];
  if (!user) return { ok: false, msg: '账号未注册，请先注册' };
  if (type === 'phone') {
    if (!verifyCode(identifier, credential)) return { ok: false, msg: '验证码错误或未过期' };
  } else {
    if (user.password !== credential) return { ok: false, msg: '密码错误' };
  }
  // 返回脱敏用户对象（不含密码）
  const sessionUser = { ...user };
  delete sessionUser.password;
  setSession(sessionUser);
  return { ok: true, user: sessionUser };
}

// ===== 登出 =====
function authLogout() {
  clearSession();
}

// ===== 获取当前登录用户（脱敏）=====
function currentUser() {
  return getSession();
}

// ===== 判断是否已登录 =====
function isLoggedIn() {
  return !!getSession();
}

// ===== 生成唯一 handle =====
function genHandle(identifier) {
  const users = getUsers();
  let base = '';
  if (identifier.includes('@')) {
    base = identifier.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 12);
    if (!base) base = 'user';
  } else {
    base = 'u' + identifier.slice(-8);
  }
  let handle = '@' + base;
  let i = 1;
  while (Object.values(users).some(u => u.handle === handle)) {
    handle = '@' + base + i;
    i++;
  }
  return handle;
}

// ===== 随机渐变背景 =====
function randomGradient() {
  const gradients = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fccb90,#d57eeb)',
    'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

// ===== 更新当前用户信息 =====
function updateCurrentUser(updates) {
  const session = getSession();
  if (!session) return false;
  const users = getUsers();
  const identifier = session.identifier;
  if (!users[identifier]) return false;
  Object.assign(users[identifier], updates);
  saveUsers(users);
  // 更新 session（脱敏）
  const updated = { ...users[identifier] };
  delete updated.password;
  setSession(updated);
  return true;
}

// ===== 预置管理员账号 =====
// 首次加载时自动创建，后续不重复创建
(function initAdminAccount() {
  const ADMIN_INIT_KEY = 'yan_admin_initialized';
  if (localStorage.getItem(ADMIN_INIT_KEY)) return;
  const users = getUsers();
  const adminId = 'admin@yan.com';
  if (!users[adminId]) {
    users[adminId] = {
      identifier: adminId,
      type: 'email',
      password: 'admin888',
      handle: '@admin',
      name: '管理员',
      bio: '言平台管理员 | 维护社区秩序，保障用户体验',
      location: '中国',
      website: '',
      avatar: null,
      avatarBg: 'linear-gradient(135deg,#1d9bf0,#0056b3)',
      verified: true,
      role: 'admin',
      followers: 999,
      following: 0,
      posts: 0,
      liked: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
      createdAt: Date.now()
    };
    saveUsers(users);
    console.log('[言] 管理员账号已初始化：admin@yan.com / admin888');
  }
  localStorage.setItem(ADMIN_INIT_KEY, '1');
})();

// ===== 检查是否是管理员 =====
function isAdmin() {
  const user = getSession();
  return !!(user && user.role === 'admin');
}

// ===== 获取所有用户列表（仅管理员可用）=====
function getAllUsers() {
  if (!isAdmin()) return [];
  const users = getUsers();
  return Object.values(users).map(u => {
    const safe = { ...u };
    delete safe.password;
    return safe;
  });
}
