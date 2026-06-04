/**
 * ===== 言 (Yan) API 客户端 =====
 * 对接后端 Node.js + SQLite API
 */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/yan/api';

// ===== Token 管理 =====
function getToken() {
  return localStorage.getItem('yan_token');
}
function setToken(token) {
  localStorage.setItem('yan_token', token);
}
function clearToken() {
  localStorage.removeItem('yan_token');
}

// ===== 通用请求（带重试）=====
async function apiRequest(path, options = {}, retries = 2) {
  const url = API_BASE + path;
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
    ...options.headers,
  };

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `请求失败 (${res.status})`);
      }
      return data;
    } catch (err) {
      if (i === retries) {
        if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
          throw new Error('网络连接失败，请检查网络');
        }
        throw err;
      }
      // 等待后重试
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

// ===== Auth API =====
const AuthAPI = {
  async register(name, email, password) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    return data.user;
  },

  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
  },

  async me() {
    return await apiRequest('/auth/me');
  },

  logout() {
    clearToken();
  },
};

// ===== Posts API =====
const PostsAPI = {
  async list(page = 0, limit = 10) {
    return await apiRequest(`/posts?page=${page}&limit=${limit}`);
  },

  async get(id) {
    return await apiRequest(`/posts/${id}`);
  },

  async create(content, media = []) {
    return await apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, media }),
    });
  },

  async delete(id) {
    return await apiRequest(`/posts/${id}`, {
      method: 'DELETE',
    });
  },

  async like(id) {
    return await apiRequest(`/posts/${id}/like`, {
      method: 'POST',
    });
  },

  async reply(postId, content) {
    return await apiRequest(`/posts/${postId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

// ===== Users API =====
const UsersAPI = {
  async get(handle) {
    return await apiRequest(`/users/${handle}`);
  },

  async posts(handle, page = 0) {
    return await apiRequest(`/users/${handle}/posts?page=${page}`);
  },

  async follow(handle) {
    return await apiRequest(`/users/${handle}/follow`, {
      method: 'POST',
    });
  },

  async search(keyword) {
    return await apiRequest(`/users/search/${encodeURIComponent(keyword)}`);
  },
};

// ===== 健康检查 =====
async function checkAPI() {
  try {
    const res = await fetch(API_BASE + '/health', { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ===== Toast 通知 =====
function showToast(msg, type = 'info') {
  const existing = document.getElementById('apiToast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'apiToast';
  const colors = { info: '#1d9bf0', error: '#f4212e', success: '#00ba7c' };
  toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${colors[type] || colors.info};color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideUp 0.3s ease`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}
