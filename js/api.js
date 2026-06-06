/**
 * ===== 言 (Yan) API 客户端 =====
 * 对接 Django 后端（端口 8888，通过 Nginx 代理到 /api/）
 */

const API_BASE = window.location.origin + '/api/';

// ===== CSRF Token 管理 =====
let _csrfToken = null;

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

async function ensureCSRF() {
  if (_csrfToken) return _csrfToken;
  _csrfToken = getCookie('csrftoken');
  if (_csrfToken) return _csrfToken;
  try {
    const resp = await fetch(API_BASE + 'users/csrf/', { credentials: 'include' });
    const data = await resp.json();
    _csrfToken = data.csrfToken || getCookie('csrftoken');
  } catch (e) {
    console.warn('[言] 获取 CSRF token 失败:', e);
  }
  return _csrfToken;
}

// ===== 通用请求 =====
async function apiRequest(path, options, retries) {
  options = options || {};
  retries = retries !== undefined ? retries : 2;
  const url = API_BASE + path;
  const method = (options.method || 'GET').toUpperCase();

  // 非 GET 请求需要 CSRF
  if (method !== 'GET') {
    await ensureCSRF();
  }

  var isFormData = options.body && options.body instanceof FormData;

  var headers = {
    ...options.headers,
  };

  // FormData 不需要手动设置 Content-Type，浏览器会自动设置 multipart boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (_csrfToken && method !== 'GET') {
    headers['X-CSRFToken'] = _csrfToken;
  }

  for (var i = 0; i <= retries; i++) {
    try {
      var fetchOptions = {
        method: method,
        headers: headers,
        credentials: 'include',
      };
      if (options.body !== undefined) {
        fetchOptions.body = options.body;
      }
      if (options.signal) {
        fetchOptions.signal = options.signal;
      }
      const res = await fetch(url, fetchOptions);
      const data = await res.json();
      if (!res.ok) {
        // 返回错误数据（包含 Django 的 error 字段），不 throw
        return data;
      }
      return data;
    } catch (err) {
      if (i === retries) {
        if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
          throw new Error('网络连接失败，请检查网络');
        }
        throw err;
      }
      await new Promise(function(r) { setTimeout(r, 500 * (i + 1)); });
    }
  }
}

// ===== Auth API =====
const AuthAPI = {
  async register(name, email, password) {
    const data = await apiRequest('users/register/', {
      method: 'POST',
      body: JSON.stringify({ username: name, email: email, password: password }),
    });
    if (data.user_id) {
      return { user: data };
    }
    return data;
  },

  async login(email, password) {
    const data = await apiRequest('users/login/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password: password }),
    });
    if (data.username) {
      return { user: data };
    }
    return data;
  },

  async me() {
    return await apiRequest('users/me/');
  },

  async logout() {
    return await apiRequest('users/logout/', { method: 'POST' });
  },
};

// ===== Posts API =====
const PostsAPI = {
  async list(page, limit) {
    page = page || 0;
    limit = limit || 10;
    var djangoPage = page + 1;
    const data = await apiRequest('posts/?page=' + djangoPage + '&page_size=' + limit);
    var posts = (data.posts || []).map(formatPost);
    var total = data.total || posts.length;
    var hasMore = data.has_more !== undefined ? data.has_more : (djangoPage * limit < total);
    return { posts: posts, hasMore: hasMore, total: total };
  },

  async get(id) {
    const data = await apiRequest('posts/' + id + '/');
    if (data.error) return { post: null, replies: [], error: data.error };
    return {
      post: formatPost(data),
      replies: (data.comments || []).map(formatComment),
    };
  },

  async search(q) {
    const data = await apiRequest('posts/search/?q=' + encodeURIComponent(q));
    var posts = (data.posts || []).map(formatPost);
    return { posts: posts, total: data.total || posts.length };
  },

  async create(content, media, location) {
    var body;

    if (media && media.length > 0) {
      // FormData 方式上传（支持图片/视频）
      body = new FormData();
      body.append('content', content);
      if (location) body.append('location', location);
      for (var i = 0; i < media.length; i++) {
        body.append('media', media[i]);
      }
    } else {
      // JSON 方式
      var payload = { content: content };
      if (location) payload.location = location;
      body = JSON.stringify(payload);
    }

    const data = await apiRequest('posts/', {
      method: 'POST',
      body: body,
    });
    if (data.error) throw new Error(data.error);
    return formatPost(data);
  },

  async delete(id) {
    return await apiRequest('posts/' + id + '/delete/', { method: 'DELETE' });
  },

  async like(id) {
    const data = await apiRequest('posts/' + id + '/like/', { method: 'POST' });
    return data;
  },

  async likers(postId) {
    const data = await apiRequest('posts/' + postId + '/likers/');
    return (data.users || []).map(formatUserData);
  },

  async reply(postId, content) {
    const data = await apiRequest('posts/' + postId + '/comments/', {
      method: 'POST',
      body: JSON.stringify({ content: content }),
    });
    if (data.error) throw new Error(data.error);
    return formatComment(data);
  },

  async deleteComment(commentId) {
    return await apiRequest('posts/comments/' + commentId + '/delete/', { method: 'DELETE' });
  },

  async follow(handle) {
    var cleanHandle = handle.replace('@', '');
    return await apiRequest('posts/by-name/' + cleanHandle + '/follow/', { method: 'POST' });
  },

  // 从 composeMedia（含 base64 url）创建带图片的帖子
  async createWithMedia(content, composeMedia, location) {
    var formData = new FormData();
    formData.append('content', content);
    if(location) formData.append('location', location);

    for(var i = 0; i < composeMedia.length; i++){
      var m = composeMedia[i];
      if(m.url && m.url.startsWith('data:')){
        // base64 → Blob
        var res = await fetch(m.url);
        var blob = await res.blob();
        var ext = m.url.match(/image\/(\w+)/);
        var filename = 'image.' + (ext ? ext[1] : 'png');
        formData.append('image', blob, filename);
      } else if(m.file){
        formData.append('image', m.file);
      }
    }

    const data = await apiRequest('posts/', {
      method: 'POST',
      body: formData,
    });
    if (data.error) throw new Error(data.error);
    return formatPost(data);
  },
};

// ===== Users API =====
const UsersAPI = {
  async get(handle) {
    var cleanHandle = handle.replace('@', '');
    const data = await apiRequest('users/profile/by-name/' + cleanHandle + '/');
    if (data.error) return null;
    return formatUserData(data);
  },

  async posts(handle, page) {
    page = page || 0;
    var cleanHandle = handle.replace('@', '');
    const data = await apiRequest('users/posts/by-name/' + cleanHandle + '/');
    var posts = (data.posts || []).map(formatPost);
    return { posts: posts, hasMore: false };
  },

  async follow(handle) {
    var cleanHandle = handle.replace('@', '');
    return await apiRequest('posts/by-name/' + cleanHandle + '/follow/', { method: 'POST' });
  },

  async search(keyword) {
    const data = await apiRequest('posts/user-search/?q=' + encodeURIComponent(keyword));
    return (data.users || []).map(formatUserData);
  },

  async updateProfile(data) {
    return await apiRequest('users/profile/update/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async uploadAvatar(file) {
    var formData = new FormData();
    formData.append('avatar', file);
    return await apiRequest('users/profile/avatar/', {
      method: 'POST',
      body: formData,
    });
  },

  async changePassword(oldPassword, newPassword) {
    return await apiRequest('users/profile/password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
  },

  async list() {
    const data = await apiRequest('users/list/');
    return (data.users || []).map(formatUserData);
  },

  async sendSMS(phone) {
    return await apiRequest('users/sms/send/', {
      method: 'POST',
      body: JSON.stringify({ phone: phone }),
    });
  },

  async following(id) {
    const data = await apiRequest('users/following/' + id + '/');
    return (data.users || []).map(formatUserData);
  },

  async followers(id) {
    const data = await apiRequest('users/followers/' + id + '/');
    return (data.users || []).map(formatUserData);
  },

  async likes(id) {
    const data = await apiRequest('users/likes/' + id + '/');
    var posts = (data.posts || []).map(formatPost);
    return { posts: posts, total: data.total || posts.length };
  },
};

// ===== Messages API =====
const MessagesAPI = {
  async list() {
    const data = await apiRequest('messages/');
    return data.conversations || [];
  },

  async create(username, content) {
    const data = await apiRequest('messages/create/', {
      method: 'POST',
      body: JSON.stringify({ username: username, content: content }),
    });
    if (data.error) throw new Error(data.error);
    return data;
  },

  async getMessages(conversationId, beforeId, limit) {
    limit = limit || 30;
    var url = 'messages/' + conversationId + '/?limit=' + limit;
    if (beforeId) {
      url += '&before_id=' + beforeId;
    }
    const data = await apiRequest(url);
    if (data.error) throw new Error(data.error);
    return data.messages || [];
  },

  async sendMessage(conversationId, content) {
    const data = await apiRequest('messages/' + conversationId + '/', {
      method: 'POST',
      body: JSON.stringify({ content: content }),
    });
    if (data.error) throw new Error(data.error);
    return data;
  },

  async deleteConversation(conversationId) {
    return await apiRequest('messages/' + conversationId + '/delete/', { method: 'DELETE' });
  },

  async unreadCount() {
    const data = await apiRequest('messages/unread-count/');
    return data.count || 0;
  },
};

// ===== Bookmarks API =====
const BookmarksAPI = {
  async list(page, pageSize) {
    page = page || 1;
    pageSize = pageSize || 10;
    const data = await apiRequest('bookmarks/?page=' + page + '&page_size=' + pageSize);
    var posts = (data.posts || []).map(formatPost);
    return {
      posts: posts,
      hasMore: data.has_more !== undefined ? data.has_more : false,
      total: data.total || posts.length,
    };
  },

  async toggle(postId) {
    const data = await apiRequest('bookmarks/' + postId + '/', { method: 'POST' });
    return data;
  },
};

// ===== Notifications API =====
const NotificationsAPI = {
  async list() {
    const data = await apiRequest('notifications/');
    return data.notifications || [];
  },

  async markRead() {
    return await apiRequest('notifications/read/', { method: 'POST' });
  },

  async unreadCount() {
    const data = await apiRequest('notifications/unread-count/');
    return data.count || 0;
  },
};

// ===== Reposts API =====
const RepostsAPI = {
  async create(postId) {
    const data = await apiRequest('reposts/' + postId + '/', { method: 'POST' });
    if (data.error) throw new Error(data.error);
    return data;
  },

  async delete(postId) {
    return await apiRequest('reposts/' + postId + '/delete/', { method: 'DELETE' });
  },
};

// ===== 数据格式转换 =====

function formatPost(p) {
  if (!p || !p.id) return { id: 0, name: '?', handle: '@?', avatar: '?', avatarBg: 'linear-gradient(135deg,#667eea,#764ba2)', text: '', time: '', createdAt: 0, likes: 0, retweets: 0, replies: 0, views: '', liked: false, retweeted: false, bookmarked: false };
  var now = Date.now();
  var created = p.created_at ? new Date(p.created_at).getTime() : now;
  var diff = now - created;
  var timeStr;
  if (diff < 60000) timeStr = '刚刚';
  else if (diff < 3600000) timeStr = Math.floor(diff / 60000) + '分钟';
  else if (diff < 86400000) timeStr = Math.floor(diff / 3600000) + '小时';
  else if (diff < 172800000) timeStr = '1天前';
  else timeStr = Math.floor(diff / 86400000) + '天前';

  var avatarUrl = p.author_avatar
    ? (p.author_avatar.startsWith('http') ? p.author_avatar : window.location.origin + p.author_avatar)
    : null;

  return {
    id: p.id,
    author_id: p.author_id,
    name: p.author_name,
    handle: '@' + p.author_name,
    verified: false,
    time: timeStr,
    createdAt: created,
    text: p.content,
    avatar: (p.author_name || '用').slice(0, 1),
    avatarBg: 'linear-gradient(135deg,#667eea,#764ba2)',
    avatarUrl: avatarUrl,
    likes: p.likes_count || 0,
    retweets: p.reposts_count || 0,
    replies: p.comments_count || 0,
    views: '',
    liked: p.is_liked || false,
    retweeted: false,
    bookmarked: false,
    postType: p.post_type || 'text',
    imageUrl: p.image || null,
    videoUrl: p.video || null,
    location: p.location || null,
  };
}

function formatComment(c) {
  return {
    id: c.id,
    name: c.author_name,
    handle: '@' + c.author_name,
    avatar: (c.author_name || '用').slice(0, 1),
    avatarBg: 'linear-gradient(135deg,#667eea,#764ba2)',
    avatarUrl: c.author_avatar ? (c.author_avatar.startsWith('http') ? c.author_avatar : window.location.origin + c.author_avatar) : null,
    text: c.content,
    time: formatTime(new Date(c.created_at).getTime()),
    createdAt: new Date(c.created_at).getTime(),
    likes: 0,
    liked: false,
  };
}

function formatUserData(u) {
  return {
    id: u.id || u.user_id,
    name: u.username,
    handle: '@' + u.username,
    avatar: (u.username || '用').slice(0, 1),
    avatarBg: 'linear-gradient(135deg,#667eea,#764ba2)',
    avatarUrl: u.avatar ? (u.avatar.startsWith('http') ? u.avatar : window.location.origin + u.avatar) : null,
    bio: u.bio || '',
    location: u.location || '',
    website: u.website || '',
    verified: false,
    followers: u.followers_count || 0,
    following: u.following_count || 0,
    posts: u.posts_count || 0,
    is_following: u.is_following || false,
    created_at: u.created_at || '',
  };
}

function formatTime(ts) {
  var diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时';
  if (diff < 172800000) return '1天前';
  return Math.floor(diff / 86400000) + '天前';
}

// ===== 健康检查 =====
async function checkAPI() {
  try {
    var url = API_BASE + 'posts/?page=1&page_size=1';
    console.log('[言] checkAPI fetching:', url);
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    console.log('[言] checkAPI response:', res.status, res.ok);
    return res.ok;
  } catch(e) {
    console.warn('[言] checkAPI failed:', e.message);
    return false;
  }
}

// ===== Toast 通知 =====
function showToast(msg, type) {
  type = type || 'info';
  var existing = document.getElementById('apiToast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'apiToast';
  var colors = { info: '#1d9bf0', error: '#f4212e', success: '#00ba7c' };
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:' + (colors[type] || colors.info) + ';color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideUp 0.3s ease';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
}
