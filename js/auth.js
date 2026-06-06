/**
 * ===== AUTH SYSTEM: 账号系统 =====
 * 优先走 Django 后端 API，API 不可用时本地回退（密码哈希存储）
 */

const SESSION_KEY = 'yan_session';
const USERS_KEY = 'yan_users';
let _apiAvailable = null; // null=未检测, true=在线, false=离线

// ===== Session 管理 =====

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) { return null; }
}

function setSession(user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch(e) {}
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ===== 密码哈希工具 =====

/**
 * 对密码做 SHA-256 哈希，返回 hex 字符串
 * 用于本地回退时存储密码摘要（不存明文）
 */
async function hashPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  } catch(e) {
    // crypto.subtle 不可用时 fallback 到 btoa
    return btoa(password);
  }
}

// ===== 本地用户存储（仅用于离线回退） =====

function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch(e) { return {}; }
}

function saveLocalUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch(e) {}
}

// ===== 工具函数 =====

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

function isValidPassword(pw) {
  return pw.length >= 6;
}

function genCode(length) {
  length = length || 6;
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function randomGradient() {
  const palettes = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'],
    ['#e0c3fc', '#8ec5fc'],
    ['#f5576c', '#ff686b'],
    ['#11998e', '#38ef7d'],
  ];
  const pair = palettes[Math.floor(Math.random() * palettes.length)];
  return 'linear-gradient(135deg,' + pair[0] + ',' + pair[1] + ')';
}

// ===== Django 用户数据转本地格式 =====

function djangoUserToSession(apiUser) {
  return {
    identifier: apiUser.email || apiUser.username,
    type: 'email',
    handle: '@' + (apiUser.username || 'user'),
    name: apiUser.username || '用户',
    bio: apiUser.bio || '',
    location: apiUser.location || '',
    avatarBg: 'linear-gradient(135deg,#667eea,#764ba2)',
    avatarUrl: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : window.location.origin + apiUser.avatar) : null,
    verified: false,
    role: 'user',
    followers: apiUser.followers_count || 0,
    following: apiUser.following_count || 0,
    posts: apiUser.posts_count || 0,
    liked: 0,
    joinedDate: apiUser.created_at ? apiUser.created_at.slice(0, 10) : '',
    createdAt: Date.now(),
    _djangoUserId: apiUser.user_id || apiUser.id,
  };
}

// ===== API 状态检测 =====

async function isAPIAvailable() {
  if (_apiAvailable !== null) return _apiAvailable;
  await updateAPIStatus();
  return _apiAvailable;
}

async function updateAPIStatus() {
  try {
    // 复用 checkAPI（定义在 api.js 中）
    if (typeof checkAPI === 'function') {
      _apiAvailable = await checkAPI();
    } else {
      // api.js 未加载时的简单探测
      const res = await fetch(window.location.origin + '/api/posts/?page=1&page_size=1', {
        signal: AbortSignal.timeout(3000),
      });
      _apiAvailable = res.ok;
    }
  } catch(e) {
    _apiAvailable = false;
  }

  // 更新 UI 指示器
  let indicator = document.getElementById('apiStatusIndicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'apiStatusIndicator';
    indicator.className = 'api-status';
    document.body.appendChild(indicator);
  }
  indicator.className = 'api-status ' + (_apiAvailable ? 'online' : 'offline');
  indicator.textContent = _apiAvailable ? '已连接' : '离线';
  indicator.title = _apiAvailable ? '已连接到服务器' : '服务器离线';

  return _apiAvailable;
}

// ===== 注册 =====

async function authRegister(identifier, password, type, displayName) {
  var name = displayName || (type === 'email' ? identifier.split('@')[0] : '用户' + identifier.slice(-4));

  // 优先走后端 API
  var online = await isAPIAvailable();
  if (online && typeof AuthAPI !== 'undefined') {
    try {
      var result = await AuthAPI.register(name, identifier, password);
      if (result.error) {
        return { ok: false, msg: result.error };
      }
      if (result.user) {
        var sessionUser = djangoUserToSession(result.user);
        setSession(sessionUser);
        return { ok: true, user: sessionUser };
      }
      return { ok: false, msg: '注册失败，请稍后重试' };
    } catch(e) {
      console.warn('[auth] 注册 API 调用失败，尝试本地回退:', e.message);
      online = false;
    }
  }

  // 本地回退：密码哈希存储
  var users = getLocalUsers();
  if (users[identifier]) {
    return { ok: false, msg: '该账号已被注册' };
  }

  var hashedPw = await hashPassword(password);
  users[identifier] = {
    name: name,
    identifier: identifier,
    type: type || 'email',
    passwordHash: hashedPw,
    avatarBg: randomGradient(),
    createdAt: Date.now(),
  };
  saveLocalUsers(users);

  // 自动登录
  var localUser = {
    identifier: identifier,
    type: type || 'email',
    handle: '@' + name,
    name: name,
    bio: '',
    location: '',
    avatarBg: users[identifier].avatarBg,
    avatarUrl: null,
    verified: false,
    role: 'user',
    followers: 0,
    following: 0,
    posts: 0,
    liked: 0,
    joinedDate: new Date().toISOString().slice(0, 10),
    createdAt: Date.now(),
    _local: true,
  };
  setSession(localUser);
  return { ok: true, user: localUser };
}

// ===== 登录 =====

async function authLogin(identifier, credential, type) {
  // 优先走后端 API
  var online = await isAPIAvailable();
  if (online && typeof AuthAPI !== 'undefined') {
    try {
      var result = await AuthAPI.login(identifier, credential);
      if (result.error) {
        return { ok: false, msg: result.error };
      }
      if (result.user) {
        var sessionUser = djangoUserToSession(result.user);
        setSession(sessionUser);
        return { ok: true, user: sessionUser };
      }
      return { ok: false, msg: '登录失败，请稍后重试' };
    } catch(e) {
      console.warn('[auth] 登录 API 调用失败，尝试本地回退:', e.message);
      online = false;
    }
  }

  // 本地回退：验证哈希密码
  var users = getLocalUsers();
  var userRecord = users[identifier];
  if (!userRecord) {
    return { ok: false, msg: '账号不存在' };
  }

  var hashedCredential = await hashPassword(credential);
  if (hashedCredential !== userRecord.passwordHash) {
    return { ok: false, msg: '密码错误' };
  }

  var localUser = {
    identifier: identifier,
    type: userRecord.type || (type || 'email'),
    handle: '@' + userRecord.name,
    name: userRecord.name,
    bio: '',
    location: '',
    avatarBg: userRecord.avatarBg || randomGradient(),
    avatarUrl: null,
    verified: false,
    role: userRecord.role || 'user',
    followers: 0,
    following: 0,
    posts: 0,
    liked: 0,
    joinedDate: new Date(userRecord.createdAt).toISOString().slice(0, 10),
    createdAt: Date.now(),
    _local: true,
  };
  setSession(localUser);
  return { ok: true, user: localUser };
}

// ===== 按任意标识登录（自动判断 email/phone/handle） =====

async function authLoginByAny(input, password) {
  // 优先走后端 API（API 端统一处理）
  var online = await isAPIAvailable();
  if (online && typeof AuthAPI !== 'undefined') {
    try {
      var result = await AuthAPI.login(input, password);
      if (result.error) {
        return { ok: false, msg: result.error };
      }
      if (result.user) {
        var sessionUser = djangoUserToSession(result.user);
        setSession(sessionUser);
        return { ok: true, user: sessionUser };
      }
      return { ok: false, msg: '登录失败，请稍后重试' };
    } catch(e) {
      console.warn('[auth] authLoginByAny API 失败，本地回退:', e.message);
    }
  }

  // 本地回退：遍历查找
  var users = getLocalUsers();

  // 先精确匹配 identifier
  if (users[input]) {
    return await authLogin(input, password, users[input].type);
  }

  // 按 handle 匹配（去掉 @ 前缀）
  var cleanInput = input.replace('@', '');
  for (var key in users) {
    if (users.hasOwnProperty(key)) {
      if (users[key].name === cleanInput) {
        return await authLogin(key, password, users[key].type);
      }
    }
  }

  return { ok: false, msg: '未找到该账号' };
}

// ===== 登出 =====

async function authLogout() {
  // 尝试调后端登出接口
  if (_apiAvailable && typeof AuthAPI !== 'undefined') {
    try { await AuthAPI.logout(); } catch(e) {}
  }
  clearSession();
}

// ===== 发送短信验证码 =====

async function sendVerifyCode(phone) {
  // 优先走后端 SMS 接口
  var online = await isAPIAvailable();
  if (online) {
    try {
      var resp = await fetch(window.location.origin + '/api/users/sms/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: phone }),
      });
      var data = await resp.json();
      if (resp.ok) {
        return { ok: true, msg: '验证码已发送' };
      }
      return { ok: false, msg: data.error || '发送失败' };
    } catch(e) {
      console.warn('[auth] SMS API 调用失败:', e.message);
    }
  }

  // 本地 mock 回退：生成验证码并缓存到 localStorage（仅供开发/演示用）
  var code = genCode(6);
  localStorage.setItem('yan_mock_sms_' + phone, JSON.stringify({
    code: code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟有效
  }));
  console.warn('[auth] [MOCK] 验证码已生成（仅用于开发模式）: ' + code);
  return { ok: true, mockCode: code, msg: '验证码已发送（开发模式）' };
}

// ===== 验证短信验证码（本地校验缓存的 mock code 或服务端校验） =====

async function verifySMSCode(phone, code) {
  var online = await isAPIAvailable();
  if (online) {
    // 生产环境应由后端验证，这里预留接口
    return { ok: true }; // 后端在注册/登录时一并校验
  }

  // 本地 mock 校验
  var cached = localStorage.getItem('yan_mock_sms_' + phone);
  if (!cached) return { ok: false, msg: '验证码已过期或未发送' };

  var data = JSON.parse(cached);
  if (Date.now() > data.expiresAt) {
    localStorage.removeItem('yan_mock_sms_' + phone);
    return { ok: false, msg: '验证码已过期' };
  }

  if (data.code === code) {
    localStorage.removeItem('yan_mock_sms_' + phone);
    return { ok: true };
  }
  return { ok: false, msg: '验证码错误' };
}

// ===== 获取当前登录用户 =====

function currentUser() {
  return getSession();
}

// ===== 判断是否已登录 =====

function isLoggedIn() {
  return !!getSession();
}

// ===== 更新当前用户信息（本地 session 同步） =====

function updateCurrentUser(updates) {
  var session = getSession();
  if (!session) return false;
  Object.assign(session, updates);
  setSession(session);
  return true;
}

// ===== 通过 API 更新用户资料 =====

async function updateProfileAPI(data) {
  if (!_apiAvailable || typeof AuthAPI === 'undefined') {
    // 本地回退：只更新 session
    if (updateCurrentUser(data)) {
      return { ok: true, msg: '资料已更新（本地）' };
    }
    return { ok: false, msg: '未登录' };
  }

  try {
    var csrfToken = null;
    if (typeof ensureCSRF === 'function') {
      csrfToken = await ensureCSRF();
    }

    var headers = { 'Content-Type': 'application/json' };
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    var resp = await fetch(window.location.origin + '/api/users/profile/update/', {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    var result = await resp.json();
    if (resp.ok) {
      // 同步更新本地 session
      updateCurrentUser(data);
      return { ok: true, data: result };
    }
    return { ok: false, msg: result.error || '更新失败' };
  } catch(e) {
    console.warn('[auth] 更新资料 API 失败:', e.message);
    // 降级为本地更新
    if (updateCurrentUser(data)) {
      return { ok: true, msg: '资料已更新（本地回退）' };
    }
    return { ok: false, msg: e.message };
  }
}

// ===== 通过 API 上传头像 =====

async function uploadAvatarAPI(file) {
  if (!file) return { ok: false, msg: '未选择文件' };

  if (!_apiAvailable) {
    return { ok: false, msg: '服务器离线，无法上传' };
  }

  try {
    var formData = new FormData();
    formData.append('avatar', file);

    var csrfToken = null;
    if (typeof ensureCSRF === 'function') {
      csrfToken = await ensureCSRF();
    }

    var headers = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    var resp = await fetch(window.location.origin + '/api/users/profile/avatar/', {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: formData,
    });

    var result = await resp.json();
    if (resp.ok) {
      var avatarUrl = result.avatar || result.url || result.avatar_url;
      if (avatarUrl) {
        if (!avatarUrl.startsWith('http')) {
          avatarUrl = window.location.origin + avatarUrl;
        }
        updateCurrentUser({ avatarUrl: avatarUrl });
      }
      return { ok: true, url: avatarUrl, data: result };
    }
    return { ok: false, msg: result.error || '上传失败' };
  } catch(e) {
    console.warn('[auth] 上传头像 API 失败:', e.message);
    return { ok: false, msg: '网络错误，上传失败' };
  }
}

// ===== 管理员账号初始化 =====

async function initAdminAccount() {
  var adminEmail = 'admin@yan.local';
  var adminName = '管理员';
  var adminPlainPwd = 'admin123';

  // 如果已有管理员则跳过
  var users = getLocalUsers();
  if (users[adminEmail]) return;

  var hashedPw = await hashPassword(adminPlainPwd);
  users[adminEmail] = {
    name: adminName,
    identifier: adminEmail,
    type: 'email',
    passwordHash: hashedPw,
    avatarBg: 'linear-gradient(135deg,#f093fb,#f5576c)',
    role: 'admin',
    createdAt: Date.now(),
  };
  saveLocalUsers(users);
  console.log('[auth] 管理员账号已初始化（本地回退模式），密码已哈希存储');
}

// ===== 管理员判断 =====
function isAdmin(){
  var user = getSession();
  return !!(user && user.role === 'admin');
}

function getAllUsers(){
  if(!isAdmin()) return [];
  var users = getLocalUsers();
  return Object.values(users).map(function(u){
    var safe = Object.assign({}, u);
    delete safe.passwordHash;
    delete safe.password;
    return safe;
  });
}
