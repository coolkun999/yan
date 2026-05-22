// ===== STATE =====
const state = {
  currentPage: 'home',
  homeTab: 'foryou',
  notifTab: 'all',
  exploreTab: 'foryou',
  profileTab: 'posts',
  theme: 'dark',
  user: { name:'王坤', handle:'@wngkn5393218313', bio:'我在中国 我是中国人，有没有交朋友', location:'中国 湖北', joinedDate:'2023年7月', followers:7, following:64, posts:392, liked:1562, verified:false },
  notifCount: 3,
  currentUser: null,
  modalTweet: null,
  quoteTweetId: null,
  editingTweetId: null,
  likers: [],
  // 分页状态
  homePage: 0,
  homePageSize: 8,
  homeHasMore: true,
  notifPage: 0,
  notifPageSize: 10,
  notifHasMore: true,
  explorePage: 0,
  explorePageSize: 15,
  exploreHasMore: true
};



// ===== UTILITIES =====
// ===== AUTH INIT =====
// 页面加载时根据登录状态初始化 UI
(function initAuth(){
  document.addEventListener('DOMContentLoaded', function(){
    applyAuthUI();
    // 游客模式：直接显示主页，不强制登录
    if(!isLoggedIn()){
      // 侧边栏显示登录按钮
      renderGuestSidebar();
    } else {
      renderLoggedInSidebar();
    }
    // 默认导航到主页
    navigate('home');
  });
})();

function applyAuthUI(){
  const loggedIn = isLoggedIn();
  const sidebar = document.getElementById('sidebar');
  if(sidebar) sidebar.style.display = '';
  const sbR = document.getElementById('sidebarRight');
  if(sbR) sbR.style.display = '';
}

// 游客模式：侧边栏显示登录入口
function renderGuestSidebar(){
  const userMenu = document.getElementById('userMenu');
  if(userMenu){
    userMenu.outerHTML = `
    <div class="guest-menu" id="guestMenu" style="margin-bottom:12px;display:flex;flex-direction:column;gap:8px;padding:12px 0">
      <button class="abtn" onclick="openAuthModal()" style="width:calc(100% - 8px);margin:0 auto;padding:12px;border-radius:var(--r);font-size:15px;font-weight:700;cursor:pointer">登录</button>
      <div style="font-size:13px;color:var(--text2);text-align:center;padding:0 8px">登录以发帖、点赞和关注</div>
    </div>`;
  }
  // 更新发帖按钮行为：未登录时弹登录提示
  const postBtn = document.querySelector('.post-btn');
  if(postBtn) postBtn.onclick = function(){ openLoginPrompt(); };
}

// 已登录：侧边栏显示用户信息
function renderLoggedInSidebar(){
  const user = currentUser();
  if(!user) return;
  const guestMenu = document.getElementById('guestMenu');
  if(guestMenu){
    guestMenu.outerHTML = `
    <div class="user-menu" id="userMenu" onclick="toggleUserDropdown(event)">
      <div class="av" style="background:${user.avatarBg||'linear-gradient(135deg,#667eea,#764ba2)'}">${(user.name||'用').slice(0,1)}</div>
      <div class="user-menu-text">
        <div class="un">${user.name||'用户'}</div>
        <div class="uh">${user.handle||''}</div>
      </div>
      <span class="dots">···</span>
    </div>`;
  }
  // 恢复发帖按钮
  const postBtn = document.querySelector('.post-btn');
  if(postBtn) postBtn.onclick = function(){ openPostModal(); };
  // 更新 state.user 以便兼容旧代码
  if(state) state.user = { name:user.name, handle:user.handle, bio:user.bio||'', location:user.location||'', joinedDate:user.joinedDate||'', followers:user.followers||0, following:user.following||0, posts:user.posts||0, verified:user.verified||false };
}

// 登录拦截：需要登录的操作前调用，返回 true 表示已登录
function requireLogin(actionDesc){
  if(isLoggedIn()) return true;
  openLoginPrompt();
  return false;
}

// ===== AUTH MODAL 控制 =====
function openAuthModal(tab){
  // 已登录则跳过
  if(isLoggedIn()) return;
  tab = tab || 'email';
  switchAuthTab(tab);
  document.getElementById('authModal').classList.add('active');
  // 重置手机号步骤
  document.getElementById('authPhoneStep1').style.display = '';
  document.getElementById('authPhoneStep2').style.display = 'none';
  document.getElementById('authPhoneStep3').style.display = 'none';
  document.getElementById('authSuccessPanel').style.display = 'none';
  // 重置输入框
  document.getElementById('authPhoneInput').value = '';
  document.getElementById('authEmailInput').value = '';
  document.getElementById('authPasswordInput').value = '';
  // 清空验证码
  document.querySelectorAll('#authCodeInputs .code-input').forEach(i=>i.value='');
  // 重置邮箱子面板（默认显示登录）
  switchEmailSub('login');
  validatePhoneInput();
  validateEmailInput();
  window._pendingPhoneUser = null;
}
function closeAuthModal(){
  document.getElementById('authModal').classList.remove('active');
}
function switchAuthTab(tab){
  const tabPhone = document.getElementById('authTabPhone');
  const tabEmail = document.getElementById('authTabEmail');
  const phonePanel = document.getElementById('authPhonePanel');
  const emailPanel = document.getElementById('authEmailPanel');
  if(tab === 'phone'){
    tabPhone.classList.add('active'); tabPhone.style.color = 'var(--text)'; tabPhone.style.fontWeight='800'; tabPhone.style.borderBottom='3px solid var(--accent)';
    tabEmail.classList.remove('active'); tabEmail.style.color = 'var(--text2)'; tabEmail.style.fontWeight='500'; tabEmail.style.borderBottom='3px solid transparent';
    phonePanel.style.display = '';
    emailPanel.style.display = 'none';
  } else {
    tabEmail.classList.add('active'); tabEmail.style.color = 'var(--text)'; tabEmail.style.fontWeight='800'; tabEmail.style.borderBottom='3px solid var(--accent)';
    tabPhone.classList.remove('active'); tabPhone.style.color = 'var(--text2)'; tabPhone.style.fontWeight='500'; tabPhone.style.borderBottom='3px solid transparent';
    phonePanel.style.display = 'none';
    emailPanel.style.display = '';
  }
}
function openLoginPrompt(){
  document.getElementById('loginPromptModal').classList.add('active');
}
function closeLoginPrompt(){
  document.getElementById('loginPromptModal').classList.remove('active');
}

// ===== 手机号登录流程 =====
function validatePhoneInput(){
  const phone = document.getElementById('authPhoneInput').value.trim();
  const btn = document.getElementById('authPhoneNextBtn');
  if(isValidPhone(phone)){
    btn.style.opacity = '1'; btn.style.cursor = 'pointer'; btn.disabled = false;
    document.getElementById('authPhoneError').style.display = 'none';
  } else {
    btn.style.opacity = '.5'; btn.style.cursor = 'default'; btn.disabled = true;
  }
}
function authPhoneNext(){
  const phone = document.getElementById('authPhoneInput').value.trim();
  if(!isValidPhone(phone)) return;
  // 检查是否已注册
  const users = getUsers();
  const isRegistered = !!users[phone];
  // 发送验证码（模拟）
  const code = sendVerifyCode(phone);
  // 开发模式：把验证码显示在页面上方便测试
  console.log('[言 验证码] 手机号 ' + phone + ' 的验证码是：' + code);
  // 显示 step2
  document.getElementById('authPhoneStep1').style.display = 'none';
  document.getElementById('authPhoneStep2').style.display = '';
  document.getElementById('authPhoneDisplay').textContent = phone;
  // 清空验证码输入
  document.querySelectorAll('#authCodeInputs .code-input').forEach(inp=>inp.value='');
  document.getElementById('authCodeInputs').children[0].focus();
  document.getElementById('authCodeError').style.display = 'none';
  // 启动倒计时
  startCountdown(60);
  // 如果是已注册：提示"登录"，未注册：提示"注册"
  document.getElementById('authCodeVerifyBtn').textContent = isRegistered ? '登录' : '注册并登录';
}
let _countdownTimer = null;
function startCountdown(seconds){
  const btn = document.getElementById('authResendBtn');
  const cd = document.getElementById('authCountdown');
  btn.style.display = 'none';
  cd.style.display = '';
  let left = seconds;
  cd.textContent = left + '秒后重新发送';
  if(_countdownTimer) clearInterval(_countdownTimer);
  _countdownTimer = setInterval(function(){
    left--;
    if(left <= 0){
      clearInterval(_countdownTimer);
      btn.style.display = '';
      cd.style.display = 'none';
    } else {
      cd.textContent = left + '秒后重新发送';
    }
  }, 1000);
}
function authResendCode(){
  const phone = document.getElementById('authPhoneInput').value.trim();
  const code = sendVerifyCode(phone);
  console.log('[言 验证码] 重新发送，验证码：' + code);
  startCountdown(60);
  document.getElementById('authCodeError').style.display = 'none';
}
// 验证码输入自动跳转（使用 data-idx 属性）
function codeInput(el){
  el.value = el.value.replace(/[^0-9]/g,'');
  const idx = parseInt(el.dataset.idx);
  if(el.value.length === 1 && idx < 5){
    document.querySelectorAll('#authCodeInputs .code-input')[idx+1].focus();
  }
  // 自动验证：6位填满时自动验证
  const inputs = document.querySelectorAll('#authCodeInputs .code-input');
  const allFilled = Array.from(inputs).every(i=>i.value.length===1);
  if(allFilled) authVerifyCode();
}
function codeBack(evt, el){
  const idx = parseInt(el.dataset.idx);
  if(evt.key === 'Backspace' && el.value.length === 0 && idx > 0){
    document.querySelectorAll('#authCodeInputs .code-input')[idx-1].focus();
  }
}
function authVerifyCode(){
  const inputs = document.querySelectorAll('#authCodeInputs .code-input');
  const code = Array.from(inputs).map(i=>i.value).join('');
  const phone = document.getElementById('authPhoneInput').value.trim();
  const users = getUsers();
  const isRegistered = !!users[phone];
  if(code.length < 6){
    showAuthCodeError('请输入完整的6位验证码');
    return;
  }
  if(!verifyCode(phone, code)){
    showAuthCodeError('验证码错误或已过期');
    return;
  }
  // 验证码正确
  if(isRegistered){
    // 已注册：直接登录（手机号登录用验证码替代密码）
    const loginResult = authLoginByPhone(phone);
    if(loginResult.ok){
      onAuthSuccess(loginResult.user);
    } else {
      showAuthCodeError(loginResult.msg);
    }
  } else {
    // 新用户：先创建账号，再引导设置昵称
    const regResult = authRegister(phone, '_phone_verify', 'phone');
    if(regResult.ok){
      // 显示设置昵称步骤
      document.getElementById('authPhoneStep2').style.display = 'none';
      document.getElementById('authPhoneStep3').style.display = '';
      document.getElementById('authPhoneNameInput').focus();
      validatePhoneNameInput();
      // 把新注册的用户存入 session（等设置完昵称再正式激活）
      window._pendingPhoneUser = regResult.user;
    } else {
      showAuthCodeError(regResult.msg);
    }
  }
}
function showAuthCodeError(msg){
  const el = document.getElementById('authCodeError');
  el.textContent = msg;
  el.style.display = '';
}
// 手机号验证码登录（验证码已在上面验证过，这里直接设置 session）
function authLoginByPhone(phone){
  const users = getUsers();
  const user = users[phone];
  if(!user) return { ok: false, msg: '账号不存在' };
  const sessionUser = { ...user };
  delete sessionUser.password;
  // 调用 auth.js 的 setSession
  setSession(sessionUser);
  return { ok: true, user: sessionUser };
}
// 手机号注册：验证昵称输入
function validatePhoneNameInput(){
  const name = document.getElementById('authPhoneNameInput').value.trim();
  const btn = document.getElementById('authPhoneNameBtn');
  const ok = name.length >= 1;
  btn.style.opacity = ok ? '1' : '.5';
  btn.style.cursor = ok ? 'pointer' : 'default';
  btn.disabled = !ok;
}
// 手机号注册：确认昵称，完成注册
function authPhoneSetName(){
  const name = document.getElementById('authPhoneNameInput').value.trim();
  if(!name){ document.getElementById('authPhoneNameError').textContent='请输入昵称'; document.getElementById('authPhoneNameError').style.display=''; return; }
  if(window._pendingPhoneUser){
    updateCurrentUser({ name: name });
    const user = currentUser();
    window._pendingPhoneUser = null;
    onAuthSuccess(user);
  }
}
// 手机号注册：跳过昵称设置
function authPhoneSkipName(){
  const pending = window._pendingPhoneUser;
  if(pending){
    setSession(pending);
    window._pendingPhoneUser = null;
    onAuthSuccess(pending);
  }
}
function onAuthSuccess(user){
  const u = user || currentUser();
  // 关闭所有弹窗
  closeAuthModal();
  closeLoginPrompt();
  // 同步登录状态：更新侧边栏、刷新当前页面
  renderLoggedInSidebar();
  // 回到主页并重新渲染（确保 compose 区域、内容等都以登录态显示）
  navigate('home');
  // 顶部短暂提示欢迎
  showToast('欢迎，' + (u ? (u.name || u.handle) : ''));
}

// 顶部 Toast 提示（1.5秒后消失）
function showToast(msg){
  const old = document.getElementById('appToast');
  if(old) old.remove();
  const el = document.createElement('div');
  el.id = 'appToast';
  el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;background:var(--accent);color:#fff;padding:10px 24px;border-radius:999px;font-size:14px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.3);pointer-events:none;animation:toastIn .2s ease';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function(){ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(function(){ if(el.parentNode) el.remove(); }, 300); }, 1500);
}

// ===== 邮箱登录/注册 =====
// 切换邮箱子面板：login | register
function switchEmailSub(sub){
  const loginSub = document.getElementById('authEmailLoginSub');
  const regSub = document.getElementById('authEmailRegSub');
  if(!loginSub || !regSub) return;
  if(sub === 'register'){
    loginSub.style.display = 'none';
    regSub.style.display = '';
    // 重置注册表单
    document.getElementById('authRegNameInput').value = '';
    document.getElementById('authRegEmailInput').value = '';
    document.getElementById('authRegPwInput').value = '';
    document.getElementById('authRegPw2Input').value = '';
    document.getElementById('authRegError').style.display = 'none';
    validateRegInput();
  } else {
    regSub.style.display = 'none';
    loginSub.style.display = '';
    document.getElementById('authEmailError').style.display = 'none';
    validateEmailInput();
  }
}

// 邮箱登录表单验证
function validateEmailInput(){
  const email = document.getElementById('authEmailInput') ? document.getElementById('authEmailInput').value.trim() : '';
  const pw = document.getElementById('authPasswordInput') ? document.getElementById('authPasswordInput').value : '';
  const loginBtn = document.getElementById('authEmailLoginBtn');
  if(!loginBtn) return;
  const ok = isValidEmail(email) && pw.length >= 1;
  loginBtn.style.opacity = ok ? '1' : '.5';
  loginBtn.style.cursor = ok ? 'pointer' : 'default';
  loginBtn.disabled = !ok;
  if(!ok) { const e = document.getElementById('authEmailError'); if(e) e.style.display = 'none'; }
}

// 注册表单验证
function validateRegInput(){
  const name = document.getElementById('authRegNameInput') ? document.getElementById('authRegNameInput').value.trim() : '';
  const email = document.getElementById('authRegEmailInput') ? document.getElementById('authRegEmailInput').value.trim() : '';
  const pw = document.getElementById('authRegPwInput') ? document.getElementById('authRegPwInput').value : '';
  const pw2 = document.getElementById('authRegPw2Input') ? document.getElementById('authRegPw2Input').value : '';
  const btn = document.getElementById('authRegBtn');
  if(!btn) return;
  const ok = name.length >= 1 && isValidEmail(email) && isValidPassword(pw) && pw === pw2;
  btn.style.opacity = ok ? '1' : '.5';
  btn.style.cursor = ok ? 'pointer' : 'default';
  btn.disabled = !ok;
  if(!ok) { const e = document.getElementById('authRegError'); if(e) e.style.display = 'none'; }
}

// 密码显示/隐藏（通用，传入 inputId）
function togglePwVisibility(inputId, btn){
  const inp = document.getElementById(inputId);
  if(!inp) return;
  if(inp.type === 'password'){
    inp.type = 'text'; btn.textContent = '隐藏';
  } else {
    inp.type = 'password'; btn.textContent = '显示';
  }
}

// 邮箱登录
function authEmailAction(action){
  const email = document.getElementById('authEmailInput').value.trim();
  const pw = document.getElementById('authPasswordInput').value;
  const errEl = document.getElementById('authEmailError');
  if(!isValidEmail(email)){ errEl.textContent='请输入有效的邮箱'; errEl.style.display=''; return; }
  if(!pw){ errEl.textContent='请输入密码'; errEl.style.display=''; return; }
  const loginResult = authLogin(email, pw, 'email');
  if(!loginResult.ok){
    errEl.textContent = loginResult.msg; errEl.style.display=''; return;
  }
  onAuthSuccess(loginResult.user);
}

// 邮箱注册（新版：含昵称和确认密码）
function authDoRegister(){
  const name = document.getElementById('authRegNameInput').value.trim();
  const email = document.getElementById('authRegEmailInput').value.trim();
  const pw = document.getElementById('authRegPwInput').value;
  const pw2 = document.getElementById('authRegPw2Input').value;
  const errEl = document.getElementById('authRegError');
  if(!name){ errEl.textContent='请输入昵称'; errEl.style.display=''; return; }
  if(!isValidEmail(email)){ errEl.textContent='请输入有效的邮箱'; errEl.style.display=''; return; }
  if(!isValidPassword(pw)){ errEl.textContent='密码至少8位'; errEl.style.display=''; return; }
  if(pw !== pw2){ errEl.textContent='两次密码不一致'; errEl.style.display=''; return; }
  const regResult = authRegister(email, pw, 'email', name);
  if(!regResult.ok){
    errEl.textContent = regResult.msg; errEl.style.display=''; return;
  }
  onAuthSuccess(regResult.user);
}

function closeAuthModalAndRefresh(){
  closeAuthModal();
  // 刷新当前页面
  if(state && state.currentPage) navigate(state.currentPage);
}
function f(n){if(n>=10000)return(n/10000).toFixed(1)+'万';if(n>=1000)return(n/1000).toFixed(1)+'k';return n}
function vSvg(){return'<svg viewBox="0 0 24 24"><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>'}
function vbSvg(){return'<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88z"/></svg>'}
function rSvg(){return'<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 7.501 3.858 7.501 7.501 0 3.808-2.851 7.091-6.056 7.765 .005.099.01.197.01.297 0 1.68-1.072 2.96-2.584 3.063C11.51 21.954 11.013 22 10.5 22c-4.394 0-8.75-3.519-8.75-8.5 0-1.085.225-2.107.625-3.025-.001-.075-.014-.155-.014-.237C2.361 10 2.056 10 1.75 10z"/></svg>'}
function cSvg(){return'<svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>'}
function shSvg(){return'<svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg>'}
function viewsSvg(){return'<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'}

// ===== TWEET RENDER =====
function renderTweet(t, showReply=false){
  const likedD = t.liked ? ' liked' : '';
  const rtD = t.retweeted ? ' retweeted' : '';
  const media = t.media && t.media.length > 0 ? renderMedia(t) : '';
  const poll = t.poll ? renderPoll(t.poll) : '';
  const quoteHtml = t.quoteTweet ? renderQuoteTweet(t.quoteTweet) : '';
  const replyForm = showReply ? `
    <div class="reply-input" style="border-top:1px solid var(--border)">
      <div class="av">王</div>
      <textarea class="ri-textarea" placeholder="发一条回复..." id="replyText-${t.id}"></textarea>
      <button class="pb" onclick="submitReply(${t.id})" style="align-self:flex-end">回复</button>
    </div>` : '';
  return `
  <div class="tweet" id="tweet-${t.id}" onclick="navigate('post',${t.id})">
    ${t.retweeted ? '<div class="retweet-indicator"><svg width="14" height="14" fill="var(--green)" viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88z"/></svg> 你已转帖</div>' : ''}
    <div class="ta" style="background:${t.avatarBg}" onclick="event.stopPropagation();navigate('user','${t.handle}')">${t.avatar}</div>
    <div class="tbdy">
      <div class="th">
        <span class="tn" onclick="event.stopPropagation();navigate('user','${t.handle}')">${t.name}</span>
        ${t.verified ? `<span class="vb"><svg viewBox="0 0 24 24"><path fill="var(--accent)" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.441c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"/></svg></span>` : ''}
        <span class="thandle">${t.handle}</span>
        <span class="tt">· ${t.time}</span>
        <button class="more-btn" onclick="event.stopPropagation();openMoreMenu(${t.id},event)" style="position:relative"><svg viewBox="0 0 24 24"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></button>
      </div>
      <div class="ttxt">${formatTweetText(t.text)}</div>
      ${media}
      ${poll}
      ${quoteHtml}
      <div class="tactions">
        <button class="ab" onclick="event.stopPropagation();openReplyModal(${t.id})">${rSvg()}<span class="ac">${f(t.replies)}</span></button>
        <button class="ab rt${rtD}" onclick="event.stopPropagation();doRetweet(${t.id},this)">${vbSvg()}<span class="ac">${f(t.retweets)}</span></button>
        <button class="ab like${likedD}" onclick="event.stopPropagation();doLike(${t.id},this)">${vSvg()}<span class="ac" id="lk-${t.id}">${f(t.likes)}</span></button>
        <button class="ab" onclick="event.stopPropagation();openShareModal(${t.id})">${viewsSvg()}<span class="ac">${t.views}</span></button>
        <button class="ab" onclick="event.stopPropagation();openMoreMenu(${t.id},event)"><svg viewBox="0 0 24 24" fill="var(--text2)"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"/></svg></button>
      </div>
    </div>
  </div>`;
}

// 格式化推文文本
function formatTweetText(text){
  return text.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>').replace(/#(\S+)/g,'<a href="#" style="color:var(--accent)">#$1</a>').replace(/@(\S+)/g,'<a href="#" style="color:var(--accent)">@$1</a>');
}

// ===== MEDIA RENDER =====
function renderMedia(t){
  if(!t.media) return '';
  const imgs = t.media;
  const count = imgs.length;
  if(count === 1){
    return `<div class="tmedia"><div class="media-single" style="width:100%;height:280px;background:${imgs[0].bg};border-radius:16px;display:flex;align-items:center;justify-content:center;overflow:hidden">
      <div style="font-size:64px">${imgs[0].icon||'📷'}</div>
    </div></div>`;
  }
  if(count === 2){
    return `<div class="tmedia" style="display:grid;grid-template-columns:1fr 1fr;gap:2px;border-radius:16px;overflow:hidden">
      ${imgs.map(m=>`<div style="height:200px;background:${m.bg};display:flex;align-items:center;justify-content:center;font-size:48px">${m.icon||'📷'}</div>`).join('')}
    </div>`;
  }
  if(count === 3){
    return `<div class="tmedia" style="display:grid;grid-template-columns:1fr 1fr;gap:2px;border-radius:16px;overflow:hidden">
      <div style="grid-row:span 2;height:100%;min-height:200px;background:${imgs[0].bg};display:flex;align-items:center;justify-content:center;font-size:48px">${imgs[0].icon||'📷'}</div>
      ${imgs.slice(1).map(m=>`<div style="height:100px;background:${m.bg};display:flex;align-items:center;justify-content:center;font-size:40px">${m.icon||'📷'}</div>`).join('')}
    </div>`;
  }
  // 4 images
  return `<div class="tmedia" style="display:grid;grid-template-columns:1fr 1fr;gap:2px;border-radius:16px;overflow:hidden">
    ${imgs.map(m=>`<div style="height:160px;background:${m.bg};display:flex;align-items:center;justify-content:center;font-size:48px">${m.icon||'📷'}</div>`).join('')}
  </div>`;
}

// ===== QUOTE TWEET RENDER =====
function renderQuoteTweet(quoteId){
  const qt=DB.tweets.find(x=>x.id===quoteId);
  if(!qt) return '';
  return `
    <div class="quote-tweet-card" onclick="event.stopPropagation();navigate('post',${qt.id})" style="margin-top:12px;padding:12px;border:1px solid var(--border);border-radius:16px;cursor:pointer;transition:background .2s">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <div class="ta" style="background:${qt.avatarBg};width:20px;height:20px;font-size:10px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${qt.avatar}</div>
        <span style="font-weight:700;font-size:13px">${qt.name}</span>
        ${qt.verified?'<span class="vb" style="transform:scale(.85)"><svg viewBox="0 0 24 24"><path fill="var(--accent)" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.441c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"/></svg></span>':''}
        <span style="color:var(--text2);font-size:13px">${qt.handle}</span>
        <span style="color:var(--text2);font-size:13px">· ${qt.time}</span>
      </div>
      <div style="font-size:14px;color:var(--text);line-height:1.5">${qt.text.length>120?qt.text.slice(0,120)+'...':qt.text}</div>
    </div>
  `;
}

// ===== POLL RENDER =====
function renderPoll(poll){
  const totalVotes = poll.options.reduce((s,o)=>s+(o.votes||0),0);
  const hasVoted = poll.voted !== undefined && poll.voted !== null;
  return `
    <div class="poll-card" style="margin-top:12px;border:1px solid var(--border);border-radius:16px;overflow:hidden">
      ${poll.options.map((o,i)=>{
        const pct = totalVotes > 0 ? Math.round((o.votes/totalVotes)*100) : 0;
        const isVoted = hasVoted && poll.voted === i;
        return `
        <div class="poll-option${isVoted?' voted':''}" onclick="event.stopPropagation();votePoll(this)" data-tweetid="${poll.tweetId}" data-index="${i}" style="padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;position:relative;overflow:hidden;min-height:48px;display:flex;align-items:center;transition:background .2s">
          ${hasVoted ? `<div style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:var(--accent);opacity:.15;border-radius:0 9999px 9999px 0;transition:width .6s ease"></div>` : ''}
          <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px">
            <span style="font-size:15px;font-weight:${isVoted?'700':'400'};flex:1">${o.label}</span>
            ${hasVoted ? `<span style="font-size:15px;font-weight:700;color:${isVoted?'var(--accent)':'var(--text)'}">${pct}%</span>` : ''}
          </div>
        </div>`;
      }).join('')}
      <div style="padding:8px 16px;font-size:13px;color:var(--text2)">${f(totalVotes)} 票 · ${poll.endsIn||'还剩23小时'}</div>
    </div>
  `;
}
function votePoll(el){
  const tweetId = parseInt(el.dataset.tweetid);
  const optIndex = parseInt(el.dataset.index);
  const t = DB.tweets.find(x=>x.id===tweetId);
  if(!t || !t.poll) return;
  if(t.poll.voted !== undefined && t.poll.voted !== null) return; // 已投票
  t.poll.voted = optIndex;
  t.poll.options[optIndex].votes = (t.poll.options[optIndex].votes||0) + 1;
  LS.save();
  // 重新渲染当前帖子
  const tweetEl = document.getElementById('tweet-'+tweetId);
  if(tweetEl) tweetEl.outerHTML = renderTweet(t);
}

// ===== PAGES =====
function navigate(page, param){
  state.currentPage = page;
  document.getElementById('sidebar').style.display = '';
  document.getElementById('sidebarRight').style.display = 'flex';
  document.getElementById('authPage').classList.remove('active');
  document.getElementById('authPage').innerHTML = '';
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const navMap = {home:'nav-home',explore:'nav-explore',notifications:'nav-notif',messages:'nav-messages',bookmarks:'nav-bookmarks',profile:'nav-profile',settings:'nav-settings'};
  if(navMap[page]) document.getElementById(navMap[page])?.classList.add('active');
  window.scrollTo(0,0);

  switch(page){
    case 'home': renderHome(); break;
    case 'explore': renderExplore(); break;
    case 'notifications': renderNotifications(); break;
    case 'messages': renderMessages(); break;
    case 'bookmarks': renderBookmarks(); break;
    case 'profile': renderProfile(param); break;
    case 'settings': renderSettings(); break;
    case 'post': renderPostDetail(param); break;
    case 'user': renderUserProfile(param); break;
    case 'search': renderSearch(param); break;
    case 'trending': renderTrending(); break;
    case 'auth': renderAuth(); break;
    case 'lists': renderLists(); break;
    case 'topics': renderTopics(); break;
    case 'topic': renderTopicPage(param); break;
    case 'communities': renderCommunities(); break;
    case 'monetization': renderMonetization(); break;
    case 'ads': renderAds(); break;
    case 'spaces': renderSpaces(); break;
    case 'following': renderFollowing(); break;
    case 'followers': renderFollowers(); break;
    default: renderHome();
  }
  closeAllDropdowns();
}

// ===== HOME PAGE =====
function renderHome(){
  const main = document.getElementById('mainContent');
  const u = state.user;
  const forYouActive = state.homeTab !== 'following';
  main.innerHTML = `
    <div class="ct">
      <div class="main-header" style="padding:0 16px;flex-direction:column;align-items:stretch;gap:0">
        <div style="display:flex;align-items:center;gap:20px;padding:12px 0">
          <div class="page-title" style="font-size:20px;font-weight:800">主页</div>
        </div>
        <div class="tab-row" style="border-bottom:none">
          <div class="tab ${forYouActive?'active':''}" onclick="switchHomeTab('foryou')">为你推荐</div>
          <div class="tab ${!forYouActive?'active':''}" onclick="switchHomeTab('following')">正在关注</div>
        </div>
      </div>
    </div>
    ${isLoggedIn() ? `
    <div class="compose">
      <div class="av" style="background:${currentUser()&&currentUser().avatarBg||'linear-gradient(135deg,#667eea,#764ba2)'}">${currentUser()&&currentUser().name?currentUser().name.slice(0,1):'我'}</div>
      <div class="ca">
        <textarea class="cin" placeholder="有什么新鲜事？" id="homeCompose" oninput="updateComposeBtn()"></textarea>
        <div class="ctb">
          <div class="ctools">
            <button class="tb" title="媒体"><svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M3 5.5C3 4.12 4.12 3 5.5 3h13C19.88 3 21 4.12 21 5.5v13c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-13zM5.5 5c-.28 0-.5.22-.5.5v9.09l3.4-3.4a.5.5 0 0 1 .7 0l3.06 3.06 2.63-1.32a.5.5 0 0 1 .48.04l2.23 1.63V5.5c0-.28-.22-.5-.5-.5h-12zM9 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg></button>
            <button class="tb" title="GIF"><svg viewBox="0 0 24 24"><path d="M19 10.5V8.8h-4.4v6.4h1.7v-2h2v-1.7h-2v-1H19zm-7.3-1.7h1.7v6.4h-1.7V8.8zm-3.6 1.6c.4 0 .9.2 1.2.5l1.2-1C9.9 9.2 9 8.8 8.1 8.8c-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2c1 0 1.8-.4 2.4-1.1v-2.5H7.7v1.2h1.2v.6c-.2.1-.5.2-.8.2-.9 0-1.6-.7-1.6-1.6 0-.8.7-1.6 1.6-1.6z"/></svg></button>
            <button class="tb" title="投票"><svg viewBox="0 0 24 24"><path d="M18 5h-1V3a1 1 0 0 0-2 0v2h-2V3a1 1 0 1 0-2 0v2H9V3a1 1 0 0 0-2 0v2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM6 19V9h12v10H6zm3-7h2v5H9v-5zm4-3h2v8h-2V9z"/></svg></button>
            <button class="tb" onclick="toggleEmoji()" title="表情"><svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-8 6c.6.8 1.6 1.5 3 1.5s2.4-.7 3-1.5l-1-.7c-.3.4-1 .8-2 .8s-1.7-.4-2-.8l-1 .7z"/></svg></button>
            <button class="tb" onclick="alert('日程安排功能即将上线')" title="安排"><svg viewBox="0 0 24 24"><path d="M7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg></button>
            <button class="tb" onclick="alert('位置功能即将上线')" title="位置"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg></button>
          </div>
          <button class="pb" id="homePostBtn" disabled onclick="homePost()">发帖</button>
        </div>
      </div>
    </div>` : `
    <div class="compose" style="cursor:pointer;padding:16px;display:flex;align-items:center;justify-content:space-between" onclick="openAuthModal()">
      <span style="font-size:20px;color:var(--text2)">有什么新鲜事？</span>
      <button class="abtn" style="width:auto;padding:10px 20px;font-size:15px;pointer-events:none">发帖</button>
    </div>`}
    <div id="homeFeed">${forYouActive ? renderForYouFeed() : renderFollowingFeed()}</div>
  `;
  initEmojiPicker();
}

function renderForYouFeed(){
  const promoted = `
    <div class="tweet" style="cursor:default">
      <div style="padding:0 16px 4px 52px;font-size:13px;color:var(--text2);display:flex;align-items:center;gap:6px">
        <svg width="14" height="14" fill="var(--text2)" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm2.07-7.75l-.9.92C12.45 11.9 12 13.5 12 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
        <span>推广内容</span>
      </div>
      <div style="display:flex;gap:12px;padding:0 16px 12px">
        <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#1a73e8,#4285f4);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;flex-shrink:0">IB</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:700;font-size:15px">Interactive Brokers</span>
            <span style="color:var(--text2);font-size:15px">@IBKR</span>
            <span style="color:var(--text2);font-size:15px">· 赞助</span>
          </div>
          <div style="margin-top:4px;font-size:15px;line-height:1.6">choose Interactive Brokers<br>Sign up for a free trial today!</div>
          <div style="margin-top:8px;padding:12px;border:1px solid var(--border);border-radius:12px">
            <div style="font-size:14px;color:var(--text2)">Interactive Brokers Hong Kong Ltd is regulated by the SFC. Your capital is at risk.</div>
            <div style="margin-top:4px;font-size:13px;color:var(--text2)">来自 interactivebrokers.com.hk</div>
          </div>
          <div class="tactions" style="margin-top:12px">
            <button class="ab"><svg viewBox="0 0 24 24"><path d="M1.751 10c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13z"/></svg><span class="ac">12</span></button>
            <button class="ab"><svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88z"/></svg><span class="ac">9</span></button>
            <button class="ab"><svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z"/></svg><span class="ac">182</span></button>
            <button class="ab"><svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg><span class="ac">408万</span></button>
          </div>
        </div>
      </div>
    </div>`;

  // 分页加载：获取当前页的数据
  const start = 0;
  const end = (state.homePage + 1) * state.homePageSize;
  const pageTweets = DB.tweets.slice(start, end);
  state.homeHasMore = end < DB.tweets.length;

  return promoted + pageTweets.map(t=>renderTweet(t)).join('') + renderLoadMoreBtn('home');
}

function renderFollowingFeed(){
  const followingTweets = DB.tweets.filter(t => t.handle === '@linxiaoyu' || t.handle === '@techdaily');
  if(followingTweets.length === 0){
    return `<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19z"/></svg><h3>还没有内容</h3><p>关注更多用户，在这里看到他们的帖子</p></div>`;
  }
  return followingTweets.map(t=>renderTweet(t)).join('');
}

// 加载更多按钮渲染
function renderLoadMoreBtn(type){
  if(type === 'home'){
    if(!state.homeHasMore) return '<div class="load-more-container"><div style="color:var(--text2);font-size:14px;padding:16px">已加载全部内容</div></div>';
    return `<div class="load-more-container" id="homeLoadMore">
      <button class="load-more-btn" onclick="loadMoreHome()">
        <span>加载更多</span>
      </button>
    </div>`;
  }
  return '';
}

// 加载更多首页内容
function loadMoreHome(){
  const container = document.getElementById('homeLoadMore');
  if(container){
    container.innerHTML = '<div class="loading-more"><div class="load-spinner"></div>加载中...</div>';
  }

  // 模拟加载延迟
  setTimeout(()=>{
    state.homePage++;

    // 获取当前要显示的推文数量
    const itemsPerPage = state.homePageSize;
    const totalToShow = (state.homePage + 1) * itemsPerPage;
    const pageTweets = DB.tweets.slice(0, totalToShow);
    state.homeHasMore = totalToShow < DB.tweets.length;

    const feed = document.getElementById('homeFeed');
    if(feed){
      // 创建新的推广内容
      const promotedHTML = `
        <div class="tweet" style="cursor:default">
          <div style="padding:0 16px 4px 52px;font-size:13px;color:var(--text2);display:flex;align-items:center;gap:6px">
            <svg width="14" height="14" fill="var(--text2)" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm2.07-7.75l-.9.92C12.45 11.9 12 13.5 12 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
            <span>推广内容</span>
          </div>
          <div style="display:flex;gap:12px;padding:0 16px 12px">
            <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#1a73e8,#4285f4);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;flex-shrink:0">IB</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-weight:700;font-size:15px">Interactive Brokers</span>
                <span style="color:var(--text2);font-size:15px">@IBKR</span>
                <span style="color:var(--text2);font-size:15px">· 赞助</span>
              </div>
              <div style="margin-top:4px;font-size:15px;line-height:1.6">choose Interactive Brokers<br>Sign up for a free trial today!</div>
              <div style="margin-top:8px;padding:12px;border:1px solid var(--border);border-radius:12px">
                <div style="font-size:14px;color:var(--text2)">Interactive Brokers Hong Kong Ltd is regulated by the SFC. Your capital is at risk.</div>
                <div style="margin-top:4px;font-size:13px;color:var(--text2)">来自 interactivebrokers.com.hk</div>
              </div>
              <div class="tactions" style="margin-top:12px">
                <button class="ab"><svg viewBox="0 0 24 24"><path d="M1.751 10c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13z"/></svg><span class="ac">12</span></button>
                <button class="ab"><svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88z"/></svg><span class="ac">9</span></button>
                <button class="ab"><svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z"/></svg><span class="ac">182</span></button>
                <button class="ab"><svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg><span class="ac">408万</span></button>
              </div>
            </div>
          </div>
        </div>`;

      const allTweetsHTML = pageTweets.map(t=>renderTweet(t)).join('');
      const loadMoreHTML = renderLoadMoreBtn('home');
      feed.innerHTML = promotedHTML + allTweetsHTML + loadMoreHTML;
      initEmojiPicker();
    }
  }, 500);
}

function switchHomeTab(tab){
  state.homeTab = tab;
  state.homePage = 0;
  state.homeHasMore = true;
  renderHome();
}
function updateComposeBtn(){
  const v = document.getElementById('homeCompose').value.trim();
  document.getElementById('homePostBtn').disabled = v.length===0;
}
function homePost(){
  if(!requireLogin()) return;
  const v = document.getElementById('homeCompose').value.trim();
  if(!v) return;
  const viewsOptions=['15','28','47','89','124','203'];
  const t = {id:Date.now(),name:"王坤",handle:"@wngkn5393218313",verified:false,time:"刚刚",text:v,avatar:"王",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",likes:0,retweets:0,replies:0,views:viewsOptions[Math.floor(Math.random()*viewsOptions.length)],liked:false,retweeted:false,bookmarked:false};
  DB.tweets.unshift(t);
  document.getElementById('homeCompose').value = '';
  document.getElementById('homePostBtn').disabled = true;
  // 重置分页状态
  state.homePage = 0;
  state.homeHasMore = true;
  renderHome();
}

// ===== LOCALSTORAGE 持久化 =====
const LS = {
  KEY: 'yan_data_v2',  // 版本升级，自动丢弃旧缓存
  save(){
    const data = {
      _v: 2,
      // 只保存用户互动状态，不存完整帖子数据（避免覆盖 db.js 的新字段）
      tweetStates: DB.tweets.map(t=>({id:t.id,liked:t.liked,retweeted:t.retweeted,bookmarked:t.bookmarked,retweets:t.retweets,likes:t.likes,replies:t.replies,pinned:t.pinned,poll:t.poll})),
      bookmarks: DB.bookmarks,
      replies: DB.replies,
      following: DB.following,
      followers: DB.followers,
      notifications: DB.notifications,
      messages: DB.messages,
      // 用户发的新帖（id > 1000000 说明是运行时创建的）
      userTweets: DB.tweets.filter(t=>t.id>1000000)
    };
    try{ localStorage.setItem(LS.KEY, JSON.stringify(data)); }catch(e){}
  },
  load(){
    try{
      const raw = localStorage.getItem(LS.KEY);
      if(!raw) return null;
      const d = JSON.parse(raw);
      if(!d._v || d._v < 2) return null; // 旧版本数据直接丢弃
      return d;
    }catch(e){ return null; }
  },
  clear(){ try{ localStorage.removeItem(LS.KEY); localStorage.removeItem('yan_data_v1'); }catch(e){} }
};

// 启动时加载持久化数据
(function loadPersistedData(){
  // 清除旧版本缓存
  try{ localStorage.removeItem('yan_data_v1'); }catch(e){}

  const saved = LS.load();
  if(saved){
    // 把用户互动状态合并回 db.js 的帖子（不替换整个帖子）
    if(saved.tweetStates){
      saved.tweetStates.forEach(s=>{
        const t = DB.tweets.find(x=>x.id===s.id);
        if(t){
          t.liked = s.liked;
          t.retweeted = s.retweeted;
          t.bookmarked = s.bookmarked;
          t.retweets = s.retweets;
          t.likes = s.likes;
          t.replies = s.replies;
          if(s.pinned) t.pinned = s.pinned;
          // 合并投票状态
          if(s.poll && t.poll) t.poll.voted = s.poll.voted;
          if(s.poll && t.poll) t.poll.options = s.poll.options;
        }
      });
    }
    // 把用户自己发的新帖（运行时创建）追加进去
    if(saved.userTweets && saved.userTweets.length > 0){
      saved.userTweets.forEach(ut=>{
        if(!DB.tweets.find(x=>x.id===ut.id)) DB.tweets.unshift(ut);
      });
    }
    if(saved.bookmarks) DB.bookmarks = saved.bookmarks;
    if(saved.replies) DB.replies = saved.replies;
    if(saved.following) DB.following = saved.following;
    if(saved.followers) DB.followers = saved.followers;
    if(saved.notifications) DB.notifications = saved.notifications;
    if(saved.messages) DB.messages = saved.messages;
    console.log('[言] v2 数据加载完成');
  }
})();

// 重置数据（清除 localStorage，刷新恢复默认）
function resetData(){
  LS.clear();
  location.reload();
}

// ===== SIDEBAR TREND FILTER =====
const TREND_DATA = {
  all: [
    {cat:'科技 · 趋势', name:'#AI大模型', count:'12.3万 条帖子'},
    {cat:'娱乐 · 趋势', name:'#新剧热播', count:'9.8万 条帖子'},
    {cat:'体育 · 趋势', name:'#世界杯预选赛', count:'7.2万 条帖子'},
    {cat:'财经 · 趋势', name:'#A股行情', count:'5.6万 条帖子'},
    {cat:'科技 · 趋势', name:'#开源项目', count:'4.3万 条帖子'}
  ],
  tech: [
    {cat:'科技 · 趋势', name:'#AI大模型', count:'12.3万 条帖子'},
    {cat:'科技 · 趋势', name:'#开源项目', count:'4.3万 条帖子'},
    {cat:'科技 · 趋势', name:'#编程语言', count:'3.1万 条帖子'},
    {cat:'科技 · 趋势', name:'#云计算', count:'2.8万 条帖子'},
    {cat:'科技 · 趋势', name:'#量子计算', count:'1.9万 条帖子'}
  ],
  ent: [
    {cat:'娱乐 · 趋势', name:'#新剧热播', count:'9.8万 条帖子'},
    {cat:'娱乐 · 趋势', name:'#演唱会', count:'6.5万 条帖子'},
    {cat:'娱乐 · 趋势', name:'#电影上映', count:'5.2万 条帖子'},
    {cat:'娱乐 · 趋势', name:'#综艺', count:'4.1万 条帖子'},
    {cat:'娱乐 · 趋势', name:'#游戏', count:'3.7万 条帖子'}
  ],
  sport: [
    {cat:'体育 · 趋势', name:'#世界杯预选赛', count:'7.2万 条帖子'},
    {cat:'体育 · 趋势', name:'#NBA季后赛', count:'5.9万 条帖子'},
    {cat:'体育 · 趋势', name:'#欧冠', count:'4.6万 条帖子'},
    {cat:'体育 · 趋势', name:'#奥运', count:'3.8万 条帖子'},
    {cat:'体育 · 趋势', name:'#马拉松', count:'2.3万 条帖子'}
  ],
  fin: [
    {cat:'财经 · 趋势', name:'#A股行情', count:'5.6万 条帖子'},
    {cat:'财经 · 趋势', name:'#加密货币', count:'4.4万 条帖子'},
    {cat:'财经 · 趋势', name:'#美股收盘', count:'3.9万 条帖子'},
    {cat:'财经 · 趋势', name:'#房产', count:'3.2万 条帖子'},
    {cat:'财经 · 趋势', name:'#基金净值', count:'2.5万 条帖子'}
  ]
};

function filterTrends(cat){
  document.querySelectorAll('.trend-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.trend-tab[data-cat="'+cat+'"]').classList.add('active');
  const list = TREND_DATA[cat] || TREND_DATA.all;
  const html = list.map(t => '<div class="trend-item" onclick="navigate(\'trending\')"><div style="display:flex;justify-content:space-between"><span class="tm">'+t.cat+'</span><span style="color:var(--text2)">···</span></div><div class="tn2">'+t.name+'</div><div class="tc">'+t.count+'</div></div>').join('');
  document.getElementById('trendList').innerHTML = html;
}

// ===== EXPLORE PAGE =====
function renderExplore(){
  const main = document.getElementById('mainContent');
  const tab = state.exploreTab;
  const tabs = [
    {key:'foryou',label:'为你推荐'},
    {key:'trending',label:'热门'},
    {key:'news',label:'新闻'},
    {key:'sports',label:'体育'},
    {key:'entertainment',label:'娱乐'}
  ];
  let trends = getTrendsByTab(tab);
  let content = '';
  
  if(tab==='foryou'){
    // 为你推荐：热门推文
    content = DB.tweets.slice(0,6).map(t=>renderTweet(t)).join('');
  } else if(tab==='trending'){
    // 热门趋势列表
    content = trends.map(t=>renderTrendItem(t)).join('');
  } else if(tab==='news'){
    // 新闻：带图标的卡片
    content = `
      <div style="padding:16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('trending')">
        <div style="font-size:13px;color:var(--text2);margin-bottom:8px">科技 · 今日要闻</div>
        <div style="font-size:17px;font-weight:800;line-height:1.4;margin-bottom:8px">ChatGPT 发布重大更新：新增多模态交互能力</div>
        <div style="font-size:14px;color:var(--text2);line-height:1.5">OpenAI 宣布 ChatGPT 将支持语音、图像和视频交互，用户可以更自然地与 AI 对话...</div>
      </div>
      <div style="padding:16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('trending')">
        <div style="font-size:13px;color:var(--text2);margin-bottom:8px">财经 · 实时</div>
        <div style="font-size:17px;font-weight:800;line-height:1.4;margin-bottom:8px">A股三大指数集体上涨，沪指重返 3400 点</div>
        <div style="font-size:14px;color:var(--text2);line-height:1.5">今日开盘后，A股市场表现强劲，科技股和新能源板块领涨...</div>
      </div>
      <div style="padding:16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('trending')">
        <div style="font-size:13px;color:var(--text2);margin-bottom:8px">国际 · 刚刚</div>
        <div style="font-size:17px;font-weight:800;line-height:1.4;margin-bottom:8px">联合国气候峰会达成历史性协议</div>
        <div style="font-size:14px;color:var(--text2);line-height:1.5">各国代表在峰会上承诺减少碳排放，共同应对气候变化挑战...</div>
      </div>
    `;
  } else if(tab==='sports'){
    content = `
      <div style="padding:16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('trending')">
        <div style="font-size:13px;color:var(--text2);margin-bottom:8px">足球 · 世界杯预选赛</div>
        <div style="font-size:17px;font-weight:800;line-height:1.4;margin-bottom:8px">中国男足 3:1 战胜对手，成功晋级世界杯！</div>
        <div style="display:flex;align-items:center;gap:12px;font-size:14px;color:var(--text2)">
          <span>12.3万 讨论</span><span>8.9万 关注</span>
        </div>
      </div>
      <div style="padding:16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('trending')">
        <div style="font-size:13px;color:var(--text2);margin-bottom:8px">NBA · 季后赛</div>
        <div style="font-size:17px;font-weight:800;line-height:1.4;margin-bottom:8px">湖人队横扫太阳队，晋级西部决赛</div>
        <div style="display:flex;align-items:center;gap:12px;font-size:14px;color:var(--text2)">
          <span>5.6万 讨论</span><span>3.2万 关注</span>
        </div>
      </div>
    `;
  } else if(tab==='entertainment'){
    content = `
      <div style="padding:16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('trending')">
        <div style="font-size:13px;color:var(--text2);margin-bottom:8px">电影 · 热门</div>
        <div style="font-size:17px;font-weight:800;line-height:1.4;margin-bottom:8px">《阿凡达3》定档明年春节，全球首映礼阵容曝光</div>
        <div style="font-size:14px;color:var(--text2);line-height:1.5">詹姆斯·卡梅隆携主演亮相发布会，透露续集将带来前所未有的视觉体验...</div>
      </div>
      <div style="padding:16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('trending')">
        <div style="font-size:13px;color:var(--text2);margin-bottom:8px">音乐 · 新歌</div>
        <div style="font-size:17px;font-weight:800;line-height:1.4;margin-bottom:8px">周杰伦新专辑《最伟大的作品2》正式发布</div>
        <div style="font-size:14px;color:var(--text2);line-height:1.5">暌违六年，周杰伦携新专辑回归，首日销量突破百万...</div>
      </div>
    `;
  }
  
  main.innerHTML = `
    <div class="explore-tabs">
      <div class="explore-tabs-inner">
        ${tabs.map(t=>`<div class="explore-tab ${tab===t.key?'active':''}" onclick="switchExploreTab('${t.key}')">${t.label}</div>`).join('')}
      </div>
    </div>
    <div>
      ${content}
    </div>
  `;
}
function getTrendsByTab(tab){
  const allTrends = [
    {cat:'科技 · 趋势',name:'#Automation',posts:'23.4万'},
    {cat:'',name:'Freedom',region:'中国香港'},
    {cat:'',name:'#Peatwasu',posts:'12.1万'},
    {cat:'',name:'Starship',region:'全球'},
    {cat:'',name:'#InterLink',posts:'8.9万'},
    {cat:'科技 · 趋势',name:'#AI大模型',posts:'12.3万'},
    {cat:'娱乐 · 趋势',name:'#新剧热播',posts:'9.8万'},
    {cat:'体育 · 趋势',name:'#世界杯预选赛',posts:'7.2万'},
    {cat:'财经 · 趋势',name:'#A股行情',posts:'5.6万'},
    {cat:'科技 · 趋势',name:'#开源项目',posts:'4.3万'},
    {cat:'科技 · 趋势',name:'native mcp',posts:'3.8万'},
    {cat:'',name:'Excellent',region:'全球'},
    {cat:'',name:'Shanghai',region:'中国'},
    {cat:'科技 · 趋势',name:'#ChatGPT5',posts:'15.6万'},
    {cat:'娱乐 · 趋势',name:'#演唱会',posts:'6.7万'},
    {cat:'财经 · 趋势',name:'#比特币',posts:'4.2万'},
    {cat:'体育 · 趋势',name:'#NBA季后赛',posts:'3.9万'},
    {cat:'科技 · 趋势',name:'#SpaceX',posts:'2.8万'}
  ];
  if(tab==='news') return allTrends.filter(t=>t.name.includes('AI')||t.name.includes('ChatGPT')||t.name.includes('mcp'));
  if(tab==='sports') return allTrends.filter(t=>t.name.includes('世界杯')||t.name.includes('NBA'));
  if(tab==='entertainment') return allTrends.filter(t=>t.name.includes('演唱会')||t.name.includes('剧'));
  if(tab==='trending') return allTrends.slice(0, 12);
  return allTrends;
}
function renderTrendItem(t){
  const topLine = t.cat ? `<div class="explore-trend-cat">${t.cat}</div>` : (t.region ? `<div class="explore-trend-cat">${t.region}</div>` : '');
  const postsLine = t.posts ? `<div class="explore-trend-cat">${t.posts} 条帖子</div>` : '';
  return `
    <div class="explore-trend-item" onclick="navigate('trending')">
      <div class="explore-trend-info">
        ${topLine}
        <div class="explore-trend-name">${t.name}</div>
        ${postsLine}
      </div>
      <button class="explore-trend-more" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
      </button>
    </div>`;
}
function switchExploreTab(tab){
  state.exploreTab = tab;
  renderExplore();
}
function switchExploreFilter(el,cat){
  document.querySelectorAll('.explore-filter').forEach(f=>f.classList.remove('active'));
  el.classList.add('active');
}
function searchExplore(q){
  if(!q) return;
  navigate('search',q);
}

// ===== NOTIFICATIONS =====
function renderNotifications(){
  const main = document.getElementById('mainContent');
  state.notifCount = 0;
  document.getElementById('notif-badge').classList.remove('has');
  const tab = state.notifTab;
  let n = DB.notifications;
  if(tab==='mentions') n = n.filter(x=>x.type==='mention'||x.type==='reply');
  const allActive = tab==='all'?'active':'';
  const menActive = tab==='mentions'?'active':'';
  main.innerHTML = `
    <div class="ct">
      <div class="main-header" style="justify-content:space-between">
        <div class="page-title">通知</div>
        <button class="back-btn" style="display:flex" onclick="openNotifSettings()" title="设置">
          <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z"/></svg>
        </button>
      </div>
      <div class="tab-row" style="border-bottom:none">
        <div class="tab ${allActive}" onclick="switchNotifTab('all')">全部</div>
        <div class="tab ${menActive}" onclick="switchNotifTab('mentions')">提及</div>
      </div>
    </div>
    ${tab==='all'?renderPushNotifCard():''}
    ${n.length===0?`<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958z"/></svg><h3>暂无通知</h3><p>当有人与你互动时，你会在这里看到通知。</p></div>`:''}
    ${n.map(notif=>renderNotifItem(notif)).join('')}
  `;
}
function openNotifSettings(){
  const body = document.getElementById('moreModalBody');
  body.innerHTML='<div class="d-item" onclick="closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958z"/></svg> 所有通知</div><div class="d-item" onclick="closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19z"/></svg> 新粉丝</div><div class="d-item" onclick="closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z"/></svg> 喜欢</div><div class="d-item" onclick="closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88z"/></svg> 转帖</div><div class="d-item" onclick="closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 7.501 3.858 7.501 7.501 0 3.808-2.851 7.091-6.056 7.765 .005.099.01.197.01.297 0 1.68-1.072 2.96-2.584 3.063C11.51 21.954 11.013 22 10.5 22c-4.394 0-8.75-3.519-8.75-8.5 0-1.085.225-2.107.625-3.025-.001-.075-.014-.155-.014-.237C2.361 10 2.056 10 1.75 10z"/></svg> 回复和提及</div><div class="d-divider"></div><div class="d-item" onclick="alert(\'通知设置功能即将上线\');closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg> 通知设置</div>';
  document.getElementById('moreModal').classList.add('active');
}
function renderPushNotifCard(){
  return `
    <div class="push-notif-card" id="pushNotifCard">
      <button class="push-notif-close" onclick="document.getElementById('pushNotifCard').style.display='none'">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
      <h3>推送通知</h3>
      <p>开启推送通知，不错过 言 上每一条正在发生的动态。</p>
      <button class="push-notif-btn" onclick="document.getElementById('pushNotifCard').style.display='none'">打开通知</button>
    </div>`;
}
function renderNotifItem(notif){
  const typeIcons = {
    like: `<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z"/></svg>`,
    follow: `<svg viewBox="0 0 24 24"><path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zM12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm11 5h-2v-2h-2v2h-2v2h2v2h2v-2h2v-2z"/></svg>`,
    retweet: `<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 14.12l-4.432-4.14 1.364-1.46 2.068 1.97V2h2v9.45l2.068-1.97 1.364 1.46-4.432 4.14z"/></svg>`,
    reply: `<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 7.501 3.858 7.501 7.501 0 3.808-2.851 7.091-6.056 7.765.005.099.01.197.01.297 0 1.68-1.072 2.96-2.584 3.063C11.51 21.954 11.013 22 10.5 22c-4.394 0-8.75-3.519-8.75-8.5 0-1.085.225-2.107.625-3.025-.001-.075-.014-.155-.014-.237C2.361 10 2.056 10 1.75 10z"/></svg>`,
    mention: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`
  };
  const iconClass = notif.type;
  const extraIcon = notif.extra?.icon==='star'?`<div class="nicon mention"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>`:'';
  const avatars = notif.multi && notif.others ? `
    <div class="notif-avatars-multi">
      <div class="ta" style="background:${notif.avatarBg}">${notif.avatar}</div>
      ${notif.others.map(o=>`<div class="ta" style="background:${o.avatarBg}">${o.avatar}</div>`).join('')}
    </div>` : `
    <div class="ta" style="background:${notif.avatarBg};width:40px;height:40px;font-size:16px">${notif.avatar}</div>`;
  return `
    <div class="notif ${notif.unread?'unread':''}" onclick="handleNotif(${notif.id},'${notif.type}')">
      <div class="notif-layout">
        <div class="notif-icon-col">
          <div class="nicon ${iconClass}">${typeIcons[notif.type]||typeIcons.mention}</div>
          ${extraIcon}
          ${notif.type!=='follow'?avatars:''}
        </div>
        <div class="nbody" style="padding-top:2px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-weight:700;font-size:15px">${notif.name}</span>
            <span style="color:var(--text2);font-size:15px">${notif.handle}</span>
            <span style="color:var(--text2);font-size:15px">· ${notif.time}</span>
          </div>
          <div class="ntext">${notif.text}</div>
          ${notif.target?`<div class="ntarget">${notif.target}</div>`:''}
        </div>
      </div>
      <button class="notif-more" onclick="event.stopPropagation();openNotifMore(event)">
        <svg viewBox="0 0 24 24"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
      </button>
    </div>`;
}
function switchNotifTab(tab){
  state.notifTab = tab;
  renderNotifications();
}
function openNotifMore(e){}
function handleNotif(id,type){
  const n = DB.notifications.find(x=>x.id===id);
  if(n) n.unread = false;
  if(type==='follow') navigate('user',n.handle);
}

// ===== MESSAGES =====
let activeChat = null;
function renderMessages(){
  activeChat = null;
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="msg-layout" style="border-right:none">
      <div class="msg-list">
        <div class="msg-list-header">消息 <button style="background:var(--accent);color:#fff;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:20px;font-weight:300" onclick="openNewMsgModal()">+</button></div>
        <div class="msg-search">
          <div class="sbw">
            <svg viewBox="0 0 24 24"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5z"/></svg>
            <input class="sin" placeholder="搜索私信">
          </div>
        </div>
        ${DB.messages.map(m=>`
          <div class="msg-item" id="msg-${m.id}" onclick="openChat(${m.id})">
            <div class="msg-av ${m.online?'online':''}" style="background:${m.avatarBg}">${m.avatar}</div>
            <div class="msg-info">
              <div class="msg-name">${m.name} <span class="msg-time">${m.time}</span></div>
              <div class="msg-preview">${m.unread?'<span style="color:var(--text);font-weight:700">'+m.preview+'</span>':m.preview}</div>
            </div>
            ${m.unread>0?`<div class="msg-unread"></div>`:''}
          </div>
        `).join('')}
        <div class="empty-state" style="padding:40px">
          <svg viewBox="0 0 24 24"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13z"/></svg>
          <h3>暂无新消息</h3>
          <p>向感兴趣的人发送私信消息吧</p>
        </div>
      </div>
      <div class="msg-chat" id="chatArea">
        <div class="empty-state" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <svg viewBox="0 0 24 24" style="width:64px;height:64px"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13z"/></svg>
          <h3 style="margin-top:16px">选择对话开始聊天</h3>
          <p style="margin-top:8px">从左侧选择一个对话</p>
        </div>
      </div>
    </div>
  `;
}
function openChat(id){
  document.querySelectorAll('.msg-item').forEach(m=>m.classList.remove('active'));
  document.getElementById('msg-'+id)?.classList.add('active');
  const chat = DB.messages.find(m=>m.id===id);
  if(!chat) return;
  activeChat = chat;
  chat.unread = 0;
  const area = document.getElementById('chatArea');
  area.innerHTML = `
    <div class="msg-chat-header">
      <button class="back-btn" style="display:none" onclick="navigate('messages')">
        <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>
      <div class="msg-av online" style="background:${chat.avatarBg};width:40px;height:40px;font-size:16px">${chat.avatar}</div>
      <div class="msg-chat-name">${chat.name}<span>${chat.handle}</span><span class="chat-online">在线</span></div>
    </div>
    <div class="chat-body" id="chatBody">
      ${renderChatMessages(chat.messages)}
    </div>
    <div class="msg-chat-input" style="position:relative">
      <div class="emoji-picker" id="emojiPicker">
        <button class="emoji-btn" onclick="insertEmoji('😀')">😀</button>
        <button class="emoji-btn" onclick="insertEmoji('😂')">😂</button>
        <button class="emoji-btn" onclick="insertEmoji('😍')">😍</button>
        <button class="emoji-btn" onclick="insertEmoji('👍')">👍</button>
        <button class="emoji-btn" onclick="insertEmoji('🙏')">🙏</button>
        <button class="emoji-btn" onclick="insertEmoji('🎉')">🎉</button>
        <button class="emoji-btn" onclick="insertEmoji('🔥')">🔥</button>
        <button class="emoji-btn" onclick="insertEmoji('💯')">💯</button>
        <button class="emoji-btn" onclick="insertEmoji('😊')">😊</button>
        <button class="emoji-btn" onclick="insertEmoji('🤔')">🤔</button>
        <button class="emoji-btn" onclick="insertEmoji('👏')">👏</button>
        <button class="emoji-btn" onclick="insertEmoji('💪')">💪</button>
      </div>
      <div class="chat-tools">
        <button class="chat-tool" onclick="toggleEmojiPicker()" title="表情">
          <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
        </button>
        <button class="chat-tool" onclick="alert('图片功能开发中')" title="图片">
          <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </button>
      </div>
      <textarea class="chat-textarea" id="chatInput" placeholder="输入消息..." rows="1" oninput="autoGrow(this);toggleSendBtn()" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg()}"></textarea>
      <button class="chat-send" id="chatSendBtn" onclick="sendMsg()" disabled>发送</button>
    </div>
  `;
  setTimeout(()=>area.querySelector('#chatBody').scrollTop=area.querySelector('#chatBody').scrollHeight,10);
}
function renderChatMessages(messages){
  return messages.map((m,i)=>{
    const showDate = i===0 || getDateKey(messages[i-1].time) !== getDateKey(m.time);
    const dateHtml = showDate ? `<div class="chat-date">${getDateLabel(m.time)}</div>` : '';
    const seenClass = m.seen ? ' seen' : '';
    return `${dateHtml}
      <div style="display:flex;flex-direction:column;align-items:${m.sent?'flex-end':'flex-start'}">
        <div class="chat-bubble ${m.sent?'sent':'received'}">${m.text}</div>
        <div class="chat-time${seenClass}">${m.time}${m.seen&&!m.sent?' · 已读':''}</div>
      </div>`;
  }).join('');
}
function getDateKey(timeStr){
  if(timeStr.includes('今天')) return 'today';
  if(timeStr.includes('昨天')) return 'yesterday';
  if(timeStr.includes('周一')||timeStr.includes('周二')||timeStr.includes('周三')||timeStr.includes('周四')||timeStr.includes('周五')||timeStr.includes('周六')||timeStr.includes('周日')) return 'week';
  return 'other';
}
function getDateLabel(timeStr){
  if(timeStr.includes('今天')) return '今天';
  if(timeStr.includes('昨天')) return '昨天';
  if(timeStr.includes('周一')) return '周一';
  if(timeStr.includes('周二')) return '周二';
  if(timeStr.includes('周三')) return '周三';
  if(timeStr.includes('周四')) return '周四';
  if(timeStr.includes('周五')) return '周五';
  if(timeStr.includes('周六')) return '周六';
  if(timeStr.includes('周日')) return '周日';
  return '更早';
}
function toggleEmojiPicker(){
  document.getElementById('emojiPicker').classList.toggle('show');
}
function insertEmoji(emoji){
  const input = document.getElementById('chatInput');
  input.value += emoji;
  input.focus();
  toggleSendBtn();
}
function toggleSendBtn(){
  const input = document.getElementById('chatInput');
  const btn = document.getElementById('chatSendBtn');
  btn.disabled = !input.value.trim();
}
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px'}
function sendMsg(){
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text||!activeChat) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  activeChat.messages.push({sent:true,text,time:timeStr,seen:true});
  activeChat.time = timeStr;
  activeChat.preview = text;
  const body = document.getElementById('chatBody');
  const div = document.createElement('div');
  div.innerHTML = renderChatMessages([activeChat.messages[activeChat.messages.length-1]]);
  body.appendChild(div.lastElementChild);
  body.scrollTop = body.scrollHeight;
  input.value = '';
  input.style.height = '42px';
  document.getElementById('chatSendBtn').disabled = true;
  
  // 更新消息列表预览
  const msgItem = document.getElementById('msg-'+activeChat.id);
  if(msgItem){
    msgItem.querySelector('.msg-preview').innerHTML = text;
    msgItem.querySelector('.msg-time').textContent = timeStr;
    const unread = msgItem.querySelector('.msg-unread');
    if(unread) unread.remove();
  }
  
  // 显示"正在输入..."
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = `<div class="chat-typing"><div class="chat-typing-dots"><span></span><span></span><span></span></div></div>`;
  body.appendChild(typingDiv);
  body.scrollTop = body.scrollHeight;
  
  // 自动回复
  setTimeout(()=>{
    const typing = document.getElementById('typingIndicator');
    if(typing) typing.remove();
    
    const replies = [
      '好的，我知道了！',
      '哈哈，太有趣了 😄',
      '这个主意不错 👍',
      '收到，我看看',
      '明白了！',
      '等我有空详细聊聊',
      '听起来很棒！',
      '有意思，继续说',
      '我也有同感',
      '感谢分享 🙏'
    ];
    const reply = replies[Math.floor(Math.random()*replies.length)];
    const replyTime = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    activeChat.messages.push({sent:false,text:reply,time:replyTime,seen:false});
    activeChat.time = replyTime;
    activeChat.preview = reply;
    
    const replyDiv = document.createElement('div');
    replyDiv.innerHTML = renderChatMessages([activeChat.messages[activeChat.messages.length-1]]);
    body.appendChild(replyDiv.lastElementChild);
    body.scrollTop = body.scrollHeight;
    
    // 更新消息列表
    const msgItem2 = document.getElementById('msg-'+activeChat.id);
    if(msgItem2){
      msgItem2.querySelector('.msg-preview').innerHTML = `<span style="color:var(--text);font-weight:700">${reply}</span>`;
      msgItem2.querySelector('.msg-time').textContent = replyTime;
    }
  }, 1500 + Math.random()*1500);
}

// ===== BOOKMARKS =====
function renderBookmarks(){
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">书签</div>
      </div>
    </div>
    ${DB.bookmarks.length===0?`
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"/></svg>
        <h3>还没有书签</h3>
        <p>保存帖子以便稍后阅读，只需点击帖子上的书签图标即可</p>
      </div>`:
      DB.bookmarks.map(t=>renderTweet(t)).join('')
    }
  `;
}
function bookmark(id,btn){
  const t = DB.tweets.find(x=>x.id===id);
  if(!t) return;
  t.bookmarked = !t.bookmarked;
  if(t.bookmarked) DB.bookmarks.push(t);
  else DB.bookmarks = DB.bookmarks.filter(x=>x.id!==id);
  const svg = btn.querySelector('svg');
  svg.setAttribute('fill', t.bookmarked ? 'var(--accent)' : 'var(--text2)');
}

// ===== PLACEHOLDER PAGES =====
function renderPlaceholderPage(title,subtitle,icon){
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">${title}</div>
      </div>
    </div>
    <div class="empty-state">
      ${icon}
      <h3>${title}</h3>
      <p>${subtitle}</p>
    </div>
  `;
}
// ===== COMMUNITIES =====
const COMMUNITIES_DATA = [
  {id:1,name:'AI爱好者社区',desc:'探讨人工智能最新发展，交流AI技术应用',members:'12.3万',avatar:'AI',avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',joined:false,posts:'8.9k'},
  {id:2,name:'前端开发者联盟',desc:'分享前端技术栈，React/Vue/Angular开发者聚集地',members:'8.7万',avatar:'前',avatarBg:'linear-gradient(135deg,#4facfe,#00f2fe)',joined:true,posts:'6.2k'},
  {id:3,name:'创业投资圈',desc:'创业者和投资人交流平台，分享融资经验',members:'5.4万',avatar:'创',avatarBg:'linear-gradient(135deg,#f093fb,#f5576c)',joined:false,posts:'4.1k'},
  {id:4,name:'摄影爱好者',desc:'用镜头记录生活，分享摄影技巧和作品',members:'9.2万',avatar:'摄',avatarBg:'linear-gradient(135deg,#43e97b,#38f9d7)',joined:true,posts:'7.8k'},
  {id:5,name:'产品经理茶馆',desc:'产品经理的深夜食堂，聊聊需求和用户体验',members:'3.8万',avatar:'产',avatarBg:'linear-gradient(135deg,#fa709a,#fee140)',joined:false,posts:'2.9k'},
  {id:6,name:'金融科技前沿',desc:'区块链、数字货币、金融科技最新资讯',members:'6.1万',avatar:'金',avatarBg:'linear-gradient(135deg,#a18cd1,#fbc2eb)',joined:false,posts:'3.5k'},
  {id:7,name:'设计师工坊',desc:'UI/UX设计师交流社区，分享设计灵感和工具',members:'7.5万',avatar:'设',avatarBg:'linear-gradient(135deg,#ffecd2,#fcb69f)',joined:false,posts:'5.3k'},
  {id:8,name:'程序员之家',desc:'程序员的避风港，代码之外的温暖社区',members:'15.6万',avatar:'程',avatarBg:'linear-gradient(135deg,#a1c4fd,#c2e9fb)',joined:true,posts:'12.1k'}
];
function renderCommunities(){
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">社群</div>
      </div>
    </div>
    <div class="tab-row" style="border-bottom:none;padding:0 16px">
      <div class="tab active">推荐</div>
      <div class="tab">我的社群</div>
    </div>
    ${COMMUNITIES_DATA.map(c=>`
      <div class="tweet" style="cursor:pointer" onclick="openCommunityDetail(${c.id})">
        <div class="ta" style="background:${c.avatarBg}" onclick="event.stopPropagation()">${c.avatar}</div>
        <div class="tbdy">
          <div class="th">
            <span class="tn">${c.name}</span>
            <span class="thandle">· ${c.members} 成员</span>
          </div>
          <div class="ttxt" style="font-size:14px;color:var(--text2)">${c.desc}</div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
            <span style="font-size:13px;color:var(--text2)">${c.posts} 帖子</span>
            <button class="fbtn ${c.joined?'following':''}" onclick="event.stopPropagation();toggleCommunityJoin(${c.id},this)">${c.joined?'已加入':'加入'}</button>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}
function toggleCommunityJoin(id,btn){
  const c = COMMUNITIES_DATA.find(x=>x.id===id);
  if(c){c.joined=!c.joined;btn.textContent=c.joined?'已加入':'加入';btn.classList.toggle('following',c.joined);}
}
function openCommunityDetail(id){
  const c = COMMUNITIES_DATA.find(x=>x.id===id);
  if(!c) return;
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('communities')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">${c.name}</div>
      </div>
    </div>
    <div style="padding:16px;border-bottom:1px solid var(--border)">
      <div class="av" style="width:64px;height:64px;font-size:28px;margin-bottom:12px">${c.avatar}</div>
      <div style="font-size:18px;font-weight:800">${c.name}</div>
      <div style="font-size:14px;color:var(--text2);margin-top:4px">${c.desc}</div>
      <div style="display:flex;gap:16px;margin-top:12px;font-size:14px;color:var(--text2)">
        <span><strong style="color:var(--text)">${c.members}</strong> 成员</span>
        <span><strong style="color:var(--text)">${c.posts}</strong> 帖子</span>
      </div>
      <button class="fbtn ${c.joined?'following':''}" style="margin-top:12px" onclick="toggleCommunityJoin(${c.id},this)">${c.joined?'已加入':'加入'}</button>
    </div>
    <div style="padding:12px 16px;font-size:15px;color:var(--text2)">最新帖子</div>
    ${DB.tweets.slice(0,3).map(t=>renderTweet(t)).join('')}
  `;
}
// ===== MONETIZATION =====
const MONETIZATION_DATA = [
  {id:1,title:'专业版订阅',desc:'解锁高级功能',price:'¥68/月',features:['蓝色认证标识','长帖子支持','高级数据分析','自定义导航','撤销发帖','专注模式']},
  {id:2,title:'创作者订阅',desc:'通过内容获利',price:'免费',features:['Super Follows','Super Likes','Super Retweets','Tips','订阅内容']},
  {id:3,title:'广告管理',desc:'推广你的业务',price:'¥100/天起',features:['精准投放','数据分析','多种广告形式','转化追踪']}
];
function renderMonetization(){
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">创作者中心</div>
      </div>
    </div>
    <div style="padding:20px 16px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:32px;margin-bottom:8px">💰</div>
        <div style="font-size:20px;font-weight:800">通过你的内容获利</div>
        <div style="font-size:14px;color:var(--text2);margin-top:4px">将你的粉丝转化为收入</div>
      </div>
      ${MONETIZATION_DATA.map(m=>`
        <div style="background:var(--bg2);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div>
              <div style="font-size:16px;font-weight:700">${m.title}</div>
              <div style="font-size:13px;color:var(--text2)">${m.desc}</div>
            </div>
            <div style="font-size:18px;font-weight:700;color:var(--accent)">${m.price}</div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${m.features.map(f=>`<span style="background:var(--bg);padding:4px 10px;border-radius:12px;font-size:12px;color:var(--text2)">✓ ${f}</span>`).join('')}
          </div>
          <button class="fbtn" style="margin-top:16px;width:100%" onclick="alert('功能即将上线')">${m.price==='免费'?'立即开通':'立即订阅'}</button>
        </div>
      `).join('')}
      <div style="background:linear-gradient(135deg,rgba(102,126,234,.2),rgba(118,75,162,.2));border-radius:16px;padding:24px;text-align:center;border:1px solid var(--border)">
        <div style="font-size:18px;font-weight:800">创作者收益概览</div>
        <div style="display:flex;justify-content:space-around;margin-top:20px">
          <div><div style="font-size:24px;font-weight:800;color:var(--accent)">¥0</div><div style="font-size:12px;color:var(--text2)">本月收益</div></div>
          <div><div style="font-size:24px;font-weight:800">128</div><div style="font-size:12px;color:var(--text2)">新粉丝</div></div>
          <div><div style="font-size:24px;font-weight:800">2.3k</div><div style="font-size:12px;color:var(--text2)">帖子浏览</div></div>
        </div>
      </div>
    </div>
  `;
}
// ===== ADS =====
const ADS_DATA = [
  {id:1,title:'言App推广',status:'active',budget:'¥500/天',impressions:'12.3万',clicks:2341,ctr:'1.9%',startDate:'2026-05-01',endDate:'2026-06-01'},
  {id:2,title:'新品发布预告',status:'paused',budget:'¥300/天',impressions:'8.7万',clicks:1523,ctr:'1.8%',startDate:'2026-05-10',endDate:'2026-05-20'},
  {id:3,title:'618大促活动',status:'active',budget:'¥1000/天',impressions:'45.2万',clicks:8934,ctr:'2.0%',startDate:'2026-05-15',endDate:'2026-06-18'}
];
function renderAds(){
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">广告中心</div>
        <button class="post-btn" onclick="openNewAdModal()">创建广告</button>
      </div>
    </div>
    <div style="padding:16px">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--bg2);border-radius:12px;padding:16px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:24px;font-weight:800;color:var(--accent)">¥1,800</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px">总花费</div>
        </div>
        <div style="background:var(--bg2);border-radius:12px;padding:16px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:24px;font-weight:800">66.2万</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px">总曝光</div>
        </div>
        <div style="background:var(--bg2);border-radius:12px;padding:16px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:24px;font-weight:800">1.93%</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px">平均点击率</div>
        </div>
      </div>
      <div style="font-size:15px;font-weight:700;margin-bottom:12px">广告活动</div>
      ${ADS_DATA.map(a=>`
        <div style="background:var(--bg2);border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-weight:700">${a.title}</span>
                <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${a.status==='active'?'rgba(34,197,94,.2)':'rgba(234,179,8,.2)'};color:${a.status==='active'?'#22c55e':'#eab308'}">${a.status==='active'?'投放中':'已暂停'}</span>
              </div>
              <div style="font-size:12px;color:var(--text2);margin-top:4px">${a.startDate} - ${a.endDate}</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="fbtn" style="padding:6px 12px;font-size:12px" onclick="toggleAdStatus(${a.id})">${a.status==='active'?'暂停':'启用'}</button>
              <button class="fbtn following" style="padding:6px 12px;font-size:12px" onclick="editAd(${a.id})">编辑</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:12px">
            <div><div style="color:var(--text2)">预算</div><div style="font-weight:600">${a.budget}</div></div>
            <div><div style="color:var(--text2)">曝光</div><div style="font-weight:600">${a.impressions}</div></div>
            <div><div style="color:var(--text2)">点击</div><div style="font-weight:600">${a.clicks}</div></div>
            <div><div style="color:var(--text2)">点击率</div><div style="font-weight:600">${a.ctr}</div></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
function toggleAdStatus(id){const a=ADS_DATA.find(x=>x.id===id);if(a)a.status=a.status==='active'?'paused':'active';renderAds();}
function editAd(id){alert('广告编辑功能即将上线')}
function openNewAdModal(){
  const body=document.getElementById('moreModalBody');
  body.innerHTML=`
    <div style="padding:16px">
      <div style="font-size:18px;font-weight:700;margin-bottom:16px">创建新广告</div>
      <div style="margin-bottom:12px"><label style="font-size:13px;color:var(--text2)">广告名称</label><input type="text" placeholder="输入广告名称" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);margin-top:4px"></div>
      <div style="margin-bottom:12px"><label style="font-size:13px;color:var(--text2)">每日预算</label><input type="text" placeholder="¥100" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);margin-top:4px"></div>
      <div style="margin-bottom:12px"><label style="font-size:13px;color:var(--text2)">投放日期</label><input type="date" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);margin-top:4px"></div>
      <button class="fbtn" style="width:100%;margin-top:16px" onclick="alert('广告创建成功！');closeMoreMenu()">创建广告</button>
    </div>
  `;
  document.getElementById('moreModal').classList.add('active');
}
// ===== SPACES =====
const SPACES_DATA = [
  {id:1,title:'AI大模型发展趋势讨论',host:'林小雨',listeners:234,live:true,duration:'45:23',speakers:['林小雨','科技日报','程序员小张']},
  {id:2,title:'前端技术栈选择指南',host:'前端开发者社区',listeners:156,live:true,duration:'12:45',speakers:['前端开发者社区','Vue开发者','React爱好者']},
  {id:3,title:'创业融资经验分享',host:'创业老王',listeners:89,live:false,duration:'01:23:45',speakers:['创业老王','投资人老李','连续创业者']},
  {id:4,title:'摄影师分享交流会',host:'摄影师阿明',listeners:67,live:false,duration:'34:12',speakers:['摄影师阿明','摄影新手','设计爱好者']}
];
function renderSpaces(){
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">空间</div>
        <button class="post-btn" onclick="openCreateSpaceModal()">创建空间</button>
      </div>
    </div>
    <div class="tab-row" style="border-bottom:none;padding:0 16px">
      <div class="tab active">正在直播</div>
      <div class="tab">即将开始</div>
      <div class="tab">我的空间</div>
    </div>
    <div style="padding:16px">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px">🎙️ 正在直播</div>
      ${SPACES_DATA.filter(s=>s.live).map(s=>`
        <div style="background:var(--bg2);border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid var(--border);cursor:pointer" onclick="openSpace(${s.id})">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="width:8px;height:8px;background:#ef4444;border-radius:50%;animation:pulse 1.5s infinite"></span>
                <span style="font-size:12px;color:#ef4444;font-weight:600">直播中</span>
              </div>
              <div style="font-weight:700">${s.title}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:18px;font-weight:700">👥 ${s.listeners}</div>
              <div style="font-size:12px;color:var(--text2)">收听</div>
            </div>
          </div>
          <div style="font-size:13px;color:var(--text2);margin-bottom:12px">主持人：${s.host}</div>
          <div style="display:flex;gap:4px">
            ${s.speakers.map((sp,i)=>`<span style="background:var(--bg);padding:4px 8px;border-radius:12px;font-size:11px">${sp}</span>`).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
            <span style="font-size:12px;color:var(--text2)">⏱️ ${s.duration}</span>
            <button class="fbtn" onclick="event.stopPropagation();openSpace(${s.id})">立即收听</button>
          </div>
        </div>
      `).join('')}
      <div style="font-size:15px;font-weight:700;margin:20px 0 12px">📅 即将开始</div>
      ${SPACES_DATA.filter(s=>!s.live).map(s=>`
        <div style="background:var(--bg2);border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid var(--border)">
          <div style="font-weight:700;margin-bottom:8px">${s.title}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:13px;color:var(--text2)">主持人：${s.host} · 👥 ${s.listeners}人感兴趣</div>
            <button class="fbtn" onclick="alert('已预约提醒')">预约</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
function openSpace(id){
  const s=SPACES_DATA.find(x=>x.id===id);
  if(!s)return;
  const main=document.getElementById('mainContent');
  main.innerHTML=`
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('spaces')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">空间</div>
      </div>
    </div>
    <div style="padding:24px;text-align:center">
      <div style="width:80px;height:80px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:36px">🎙️</div>
      <div style="font-size:18px;font-weight:800">${s.title}</div>
      <div style="font-size:14px;color:var(--text2);margin-top:8px">主持人：${s.host}</div>
      <div style="display:flex;justify-content:center;gap:24px;margin:20px 0;font-size:14px">
        <div><span style="font-weight:800">${s.duration}</span><br><span style="color:var(--text2)">时长</span></div>
        <div><span style="font-weight:800">${s.listeners}</span><br><span style="color:var(--text2)">收听</span></div>
      </div>
      <div style="margin:16px 0">
        ${s.speakers.map(sp=>`<div style="display:inline-block;text-align:center;margin:8px"><div class="av" style="width:48px;height:48px;font-size:18px">${sp[0]}</div><div style="font-size:11px;margin-top:4px">${sp}</div></div>`).join('')}
      </div>
      <button class="fbtn" style="width:200px;margin-top:16px" onclick="alert('已加入空间')">加入收听</button>
    </div>
  `;
}
function openCreateSpaceModal(){
  const body=document.getElementById('moreModalBody');
  body.innerHTML=`
    <div style="padding:16px">
      <div style="font-size:18px;font-weight:700;margin-bottom:16px">创建空间</div>
      <div style="margin-bottom:12px"><label style="font-size:13px;color:var(--text2)">空间标题</label><input type="text" placeholder="给你的空间起个名字" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);margin-top:4px"></div>
      <div style="margin-bottom:12px"><label style="font-size:13px;color:var(--text2)">话题标签</label><input type="text" placeholder="#话题" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);margin-top:4px"></div>
      <button class="fbtn" style="width:100%;margin-top:16px" onclick="alert('空间创建成功！');closeMoreMenu()">开始直播</button>
    </div>
  `;
  document.getElementById('moreModal').classList.add('active');
}

// ===== USER DROPDOWN =====
function toggleUserDropdown(event){
  event.stopPropagation();
  const dropdown = document.getElementById('user-dropdown');
  if(dropdown.classList.contains('active')){
    dropdown.classList.remove('active');
    return;
  }
  closeAllDropdowns();
  dropdown.innerHTML = `
    <div class="user-menu-header">
      <div class="av" style="width:40px;height:40px;font-size:16px">王</div>
      <div class="user-menu-header-info">
        <div class="user-menu-header-name">王坤</div>
        <div class="user-menu-header-handle">@wngkn5393218313</div>
      </div>
    </div>
    <div class="user-menu-switch" onclick="toggleAccount()">
      切换账号
    </div>
    <div class="user-menu-divider"></div>
    <div class="user-menu-item" onclick="navigate('profile');closeAllDropdowns()">
      <svg viewBox="0 0 24 24"><path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19z"/></svg>
      个人资料
    </div>
    <div class="user-menu-item" onclick="navigate('monetization');closeAllDropdowns()">
      <svg viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
      专业版
    </div>
    <div class="user-menu-item" onclick="navigate('lists');closeAllDropdowns()">
      <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
      列表
    </div>
    <div class="user-menu-item" onclick="navigate('bookmarks');closeAllDropdowns()">
      <svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
      书签
    </div>
    <div class="user-menu-item" onclick="navigate('settings');closeAllDropdowns()">
      <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
      设置和隐私
    </div>
    <div class="user-menu-item" onclick="navigate('settings');closeAllDropdowns()">
      <svg viewBox="0 0 24 24"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>
      帮助中心
    </div>
    <div class="user-menu-divider"></div>
    <div class="user-menu-item" onclick="doLogout()">
      <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
      退出登录
    </div>
  `;
  dropdown.classList.add('active');
}
function doLogout(){
  closeAllDropdowns();
  authLogout();
  // 切换回游客侧边栏
  const userMenu = document.getElementById('userMenu');
  if(userMenu){
    userMenu.outerHTML = `
    <div class="guest-menu" id="guestMenu" style="margin-bottom:12px;display:flex;flex-direction:column;gap:8px;padding:12px 0">
      <button class="abtn" onclick="openAuthModal()" style="width:calc(100% - 8px);margin:0 auto;padding:12px;border-radius:var(--r);font-size:15px;font-weight:700;cursor:pointer">登录</button>
      <div style="font-size:13px;color:var(--text2);text-align:center;padding:0 8px">登录以发帖、点赞和关注</div>
    </div>`;
  }
  // 发帖按钮切回游客模式
  const postBtn = document.querySelector('.post-btn');
  if(postBtn) postBtn.onclick = function(){ openLoginPrompt(); };
  // 返回主页
  navigate('home');
  showToast('已退出登录');
}
function toggleAccount(){
  closeAllDropdowns();
  navigate('auth');
}

// ===== PROFILE =====
function renderProfile(){
  const u = state.user;
  const tab = state.profileTab;
  const main = document.getElementById('mainContent');
  const tabs = [
    {key:'posts',label:'帖子'},
    {key:'replies',label:'回复'},
    {key:'media',label:'媒体'},
    {key:'likes',label:'喜欢'}
  ];
  const userTweets = DB.tweets.filter(t=>t.handle==='@wngkn5393218313');
  let content = '';

  if(tab==='posts'){
    if(userTweets.length>0){
      content = userTweets.map(t=>renderTweet(t)).join('');
    }else{
      content = '<div class="empty-state"><h3>还没有帖子</h3><p>发布你的第一条帖子吧！</p></div>';
    }
  }else if(tab==='replies'){
    const userReplyIds = userTweets.map(t=>t.id);
    const allReplies = userReplyIds.flatMap(tid=>{
      const rs = (DB.replies[tid]||[]).map(r=>({...r,tweetId:tid,parentTweet:DB.tweets.find(tw=>tw.id===tid)}));
      return rs;
    }).sort((a,b)=>b.id-a.id);
    if(allReplies.length>0){
      content = allReplies.map(r=>renderProfileReply(r)).join('');
    }else{
      content = '<div class="empty-state"><h3>还没有回复</h3><p>当有人回复你的帖子时，会显示在这里</p></div>';
    }
  }else if(tab==='media'){
    const mediaTweets = userTweets.filter(t=>t.media && t.media.length > 0);
    if(mediaTweets.length>0){
      content = mediaTweets.map(t=>renderTweet(t)).join('');
    }else{
      content = '<div class="empty-state"><h3>还没有媒体内容</h3><p>发布包含图片或视频的帖子，会显示在这里</p></div>';
    }
  }else if(tab==='likes'){
    const likedTweets = DB.tweets.filter(t=>t.liked);
    if(likedTweets.length>0){
      content = likedTweets.map(t=>renderTweet(t)).join('');
    }else{
      content = '<div class="empty-state"><h3>还没有喜欢的帖子</h3><p>点击帖子下方的心形图标，喜欢的帖子会显示在这里</p></div>';
    }
  }

  const postCount = userTweets.length;
  main.innerHTML = `
    <div class="ct">
      <div class="main-header" style="justify-content:space-between">
        <div style="display:flex;align-items:center;gap:20px">
          <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
          <div>
            <div style="font-size:17px;font-weight:800">${u.name}</div>
            <div style="font-size:13px;color:var(--text2)">${f(postCount)} 帖子</div>
          </div>
        </div>
        <button class="back-btn" style="display:flex" onclick="navigate('search')" title="搜索">
          <svg viewBox="0 0 24 24"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zM2 10.25a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012 10.25z"/></svg>
        </button>
      </div>
    </div>
    <div class="profile-header">
      <div class="profile-cover" onclick="document.querySelector('.profile-avatar').click()"></div>
      <div class="profile-avatar-wrap">
        <div class="profile-avatar">王</div>
      </div>
      <button class="profile-edit-btn">编辑个人资料</button>
    </div>
    <div class="profile-info">
      <div style="height:8px"></div>
      <div class="pi-name">${u.name}</div>
      <div class="pi-handle">${u.handle}</div>
      <div class="pi-bio">${u.bio}</div>
      <div class="pi-meta">
        ${u.location?`<div class="pi-meta-item"><svg viewBox="0 0 24 24"><path d="M12 7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-5C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>${u.location}</div>`:''}
        ${u.joinedDate?`<div class="pi-meta-item"><svg viewBox="0 0 24 24"><path d="M19.708 2H4.292C3.028 2 2 3.028 2 4.292v15.416C2 20.972 3.028 22 4.292 22h15.416C20.972 22 22 20.972 22 19.708V4.292C22 3.028 20.972 2 19.708 2zm.792 17.708c0 .437-.355.792-.792.792H4.292c-.437 0-.792-.355-.792-.792V6.418c0-.437.355-.792.792-.792h16.416c.437 0 .792.355.792.792v13.29zM17 8.75c0-.414-.336-.75-.75-.75h-2.5c-.414 0-.75.336-.75.75s.336.75.75.75h2.5c.414 0 .75-.336.75-.75zm0 3.5c0-.414-.336-.75-.75-.75h-2.5c-.414 0-.75.336-.75.75s.336.75.75.75h2.5c.414 0 .75-.336.75-.75zm-5.75-3.5c-.414 0-.75.336-.75.75s.336.75.75.75h2.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-2.5zm0 3.5c-.414 0-.75.336-.75.75s.336.75.75.75h2.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-2.5zM8 8.75c0-.414-.336-.75-.75-.75h-2.5c-.414 0-.75.336-.75.75s.336.75.75.75h2.5c.414 0 .75-.336.75-.75zm0 3.5c0-.414-.336-.75-.75-.75h-2.5c-.414 0-.75.336-.75.75s.336.75.75.75h2.5c.414 0 .75-.336.75-.75z"/></svg>${u.joinedDate} 加入 ></div>`:''}
      </div>
      <div class="pi-stats">
        <span class="ps" onclick="navigate('following')"><span>${f(u.following)}</span> 正在关注</span>
        <span class="ps" onclick="navigate('followers')"><span>${f(u.followers)}</span> 关注者</span>
        <span class="ps" onclick="openLikersModal()"><span>${f(u.liked)}</span> 获赞</span>
      </div>
      <div class="profile-tabs">
        ${tabs.map(t=>`<div class="profile-tab ${tab===t.key?'active':''}" onclick="switchProfileTab('${t.key}')">${t.label}</div>`).join('')}
      </div>
    </div>
    ${!u.verified?renderVerifyBanner():''}
    ${content}
  `;
}
function switchProfileTab(tab){state.profileTab=tab;renderProfile();}
function renderProfileReply(r){
  const parent = r.parentTweet;
  return `
    <div class="tweet reply-view">
      <div class="ta"><div class="av" style="background:${r.avatarBg}">${r.avatar}</div></div>
      <div class="tb">
        <div class="th">
          <span class="tn">${r.name}</span>
          <span class="thandle">${r.handle}</span>
          <span class="tdot">·</span>
          <span class="ttime">${r.time}</span>
        </div>
        <div class="reply-to-line" style="color:var(--text2);font-size:13px;margin:2px 0 4px">回复 <span style="color:var(--accent)">${parent.handle}</span></div>
        <div class="ttext">${r.text}</div>
        ${parent.text?`<div class="quote-tweet-card mini" style="margin-top:8px"><div style="display:flex;align-items:center;gap:8px"><div class="av" style="background:${parent.avatarBg};width:24px;height:24px;font-size:12px">${parent.avatar}</div><div><span style="font-size:13px;font-weight:600">${parent.name}</span> <span style="color:var(--text2);font-size:12px">${parent.handle}</span></div></div><div style="font-size:13px;color:var(--text2);margin-top:4px">${parent.text.length>80?parent.text.slice(0,80)+'...':parent.text}</div></div>`:''}
        <div class="tact">
          <span class="tac"><svg viewBox="0 0 24 24"><path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788z"/></svg><span>${f(r.likes||0)}</span></span>
          <span class="tac" onclick="doLikeReply(${r.id},${r.tweetId||r.replyTo},this)"><svg viewBox="0 0 24 24"><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.351 4.647 2.529.816-1.178 2.356-2.529 4.646-2.529 2.878 0 5.404 2.69 5.404 5.754 0 6.378-7.453 13.112-10.063 13.16H12z"/></svg></span>
          <span class="tac"><svg viewBox="0 0 24 24"><path d="M17.53 7.47l-5-5c-.293-.293-.768-.293-1.06 0l-5 5c-.294.293-.294.768 0 1.06s.767.294 1.06 0l3.72-3.72V15c0 .414.336.75.75.75s.75-.336.75-.75V4.81l3.72 3.72c.146.147.338.22.53.22s.384-.072.53-.22c.293-.293.293-.767 0-1.06z"/></svg></span>
          <span class="tac"><svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg></span>
        </div>
      </div>
    </div>`;
}
function renderVerifyBanner(){
  return `
    <div class="verif-banner" id="verifBanner">
      <div class="verif-banner-content">
        <h3>你尚未通过认证 <span style="color:var(--accent);display:inline-flex;vertical-align:middle"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="var(--accent)" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.441c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"/></svg></span></h3>
        <p>通过认证即可获得推广回复、分析、免广告浏览等功能。立即升级你的个人资料。</p>
        <button class="verif-banner-btn" onclick="alert('认证功能即将上线')">获得认证</button>
      </div>
      <button class="verif-banner-close" onclick="document.getElementById('verifBanner').style.display='none'">
        <svg viewBox="0 0 24 24"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>
      </button>
    </div>
  `;
}

// ===== USER PROFILE =====
function renderUserProfile(handle){
  const users = {
    '@linxiaoyu':{name:'林小雨',handle:'@linxiaoyu',bio:'产品经理 / AI爱好者 / 生活记录者',followers:12834,following:432,posts:892,avatar:'林',avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',verified:true},
    '@techdaily':{name:'科技日报',handle:'@techdaily',bio:'第一时间报道科技前沿资讯',followers:892341,following:12,posts:3421,avatar:'科',avatarBg:'linear-gradient(135deg,#f093fb,#f5576c)',verified:true},
    '@zhangwei':{name:'张伟',handle:'@zhangwei',bio:'产品经理 / AI创业者',followers:5623,following:891,posts:234,avatar:'张',avatarBg:'linear-gradient(135deg,#4facfe,#00f2fe)',verified:true},
    '@lina_tech':{name:'李娜',handle:'@lina_tech',bio:'全栈工程师 / 开源贡献者',followers:8934,following:567,posts:1567,avatar:'李',avatarBg:'linear-gradient(135deg,#43e97b,#38f9d7)',verified:false}
  };
  const u = users[handle]||{name:handle.replace('@',''),handle,bio:'',followers:0,following:0,posts:0,avatar:handle[1]?.toUpperCase()||'?',avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',verified:false};
  const userTweets = DB.tweets.filter(t=>t.handle===handle);
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header" style="justify-content:space-between">
        <div style="display:flex;align-items:center;gap:20px">
          <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
          <div>
            <div style="font-size:17px;font-weight:800">${u.name}</div>
            <div style="font-size:13px;color:var(--text2)">${f(u.posts)} 帖子</div>
          </div>
        </div>
        <button class="back-btn" style="display:flex" onclick="navigate('search')" title="搜索">
          <svg viewBox="0 0 24 24"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zM2 10.25a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012 10.25z"/></svg>
        </button>
      </div>
    </div>
    <div class="profile-header">
      <div class="profile-cover"></div>
      <div class="profile-avatar-wrap">
        <div class="profile-avatar" style="background:${u.avatarBg}">${u.avatar}</div>
      </div>
    </div>
    <div class="profile-info">
      <div style="display:flex;justify-content:flex-end;gap:8px;padding-bottom:8px">
        <button class="back-btn" style="display:flex;width:36px;height:36px" onclick="navigate('search')" title="搜索">
          <svg viewBox="0 0 24 24"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5z"/></svg>
        </button>
        <button class="fbtn" id="msgBtn-${handle}" onclick="sendMsgToUser('${handle}')" style="border-radius:9999px;padding:0 16px;min-width:80px">
          <svg width="18" height="18" viewBox="0 0 24 24" style="vertical-align:middle"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13z"/></svg>
        </button>
        <button class="fbtn" id="followBtn-${handle}" onclick="toggleUserFollow('${handle}',this)">关注</button>
      </div>
      <div class="pi-name">${u.name} ${u.verified?`<span style="color:var(--accent);display:inline-flex;vertical-align:middle"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="var(--accent)" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.441c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"/></svg></span>`:''}</div>
      <div class="pi-handle">${u.handle}</div>
      <div class="pi-bio">${u.bio}</div>
      <div class="pi-stats">
        <span class="ps"><span>${f(u.following)}</span> 正在关注</span>
        <span class="ps"><span>${f(u.followers)}</span> 关注者</span>
      </div>
      <div class="profile-tabs">
        <div class="profile-tab active">帖子</div>
        <div class="profile-tab">回复</div>
        <div class="profile-tab">媒体</div>
        <div class="profile-tab">喜欢</div>
      </div>
    </div>
    ${userTweets.length>0?userTweets.map(t=>renderTweet(t)).join(''):'<div class="empty-state"><h3>还没有帖子</h3></div>'}
  `;
}
function toggleUserFollow(handle,btn){
  const text = btn.textContent.trim();
  if(text==='关注'){btn.textContent='正在关注';btn.classList.add('following');btn.classList.remove('fbtn');btn.style.cssText='background:transparent;color:var(--text);border:1px solid var(--border);border-radius:9999px;padding:7px 18px;font-size:14px;font-weight:700'}
  else{btn.textContent='关注';btn.classList.remove('following');btn.style.cssText=''}
}
function sendMsgToUser(handle){
  const cleanHandle = handle.replace('@','');
  const existingMsg = DB.messages.find(m=>m.handle==='@'+cleanHandle);
  if(existingMsg){
    navigate('messages');
    setTimeout(()=>openChat(existingMsg.id),100);
  } else {
    openNewMsgModal();
    document.getElementById('newMsgRecipient').value = cleanHandle;
  }
}

// ===== POST DETAIL =====
function renderPostDetail(id){
  const t = DB.tweets.find(x=>x.id===id);
  if(!t) return navigate('home');
  const replies = DB.replies[id]||[];
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">帖子</div>
      </div>
    </div>
    ${renderTweet(t)}
    <div class="reply-input">
      <div class="av">王</div>
      <textarea class="ri-textarea" placeholder="发一条回复..." id="replyTextMain" onkeydown="if(event.key==='Enter'&&!event.shiftKey&&event.ctrlKey){submitMainReply(${id})}"></textarea>
      <button class="pb" onclick="submitMainReply(${id})" style="align-self:flex-end">回复</button>
    </div>
    <div id="repliesArea">
      ${replies.map(r=>`
        <div class="reply-item">
          <div class="ta" style="background:${r.avatarBg};width:36px;height:36px;font-size:14px">${r.avatar}</div>
          <div class="tbdy">
            <div class="th">
              <span class="tn">${r.name}</span>
              <span class="thandle">${r.handle}</span>
              <span class="tt">· ${r.time}</span>
            </div>
            <div class="ttxt">${r.text}</div>
            <div class="tactions">
              <button class="ab" onclick="doLikeReply(${r.id},${id},this)">${vSvg()}<span class="ac">${r.likes}</span></button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  state.modalTweet = t;
}
function submitMainReply(id){
  const text = document.getElementById('replyTextMain').value.trim();
  if(!text) return;
  if(!DB.replies[id]) DB.replies[id]=[];
  const r = {id:Date.now(),replyTo:id,name:'王坤',handle:'@wngkn5393218313',avatar:'王',avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',time:'刚刚',text,likes:0,liked:false};
  DB.replies[id].push(r);
  const t = DB.tweets.find(x=>x.id===id);
  if(t) t.replies++;
  LS.save();
  const area = document.getElementById('repliesArea');
  const div = document.createElement('div');
  div.className='reply-item';
  div.innerHTML=`<div class="ta" style="background:${r.avatarBg};width:36px;height:36px;font-size:14px">${r.avatar}</div><div class="tbdy"><div class="th"><span class="tn">${r.name}</span><span class="thandle">${r.handle}</span><span class="tt">· ${r.time}</span></div><div class="ttxt">${r.text}</div><div class="tactions"><button class="ab" onclick="doLikeReply(${r.id},${id},this)">${vSvg()}<span class="ac">0</span></button></div></div>`;
  area.appendChild(div);
  document.getElementById('replyTextMain').value='';
}
function doLikeReply(rid, tid, btn){
  const rs = DB.replies[tid]||[];
  const r = rs.find(x=>x.id===rid);
  if(r){r.liked=!r.liked;r.likes+=r.liked?1:-1;LS.save();const sp=btn.querySelector('span');sp.textContent=r.likes;btn.classList.toggle('liked',r.liked)}
}
function submitReply(id){submitMainReply(id)}

// ===== SETTINGS =====
function renderSettings(){
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">设置和隐私</div>
      </div>
    </div>
    <div class="settings-list">
      <div class="settings-section">
        <div class="settings-section-title">账户</div>
        <div class="settings-item" onclick="navigate('auth')">
          <div class="settings-item-info"><h3>${state.currentUser?'王坤 (@wngkn5393218313)':'登录'}</h3><p>管理你的账号信息</p></div>
          <svg width="20" height="20" fill="var(--text2)" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">外观</div>
        <div class="settings-item">
          <div class="settings-item-info"><h3>主题</h3><p>自定义应用外观</p></div>
          <div class="theme-options">
            <div class="theme-opt dark ${state.theme==='dark'?'active':''}" onclick="setTheme('dark',this)" title="深色"></div>
            <div class="theme-opt light ${state.theme==='light'?'active':''}" onclick="setTheme('light',this)" title="浅色"></div>
            <div class="theme-opt dim ${state.theme==='dim'?'active':''}" onclick="setTheme('dim',this)" title="暗淡"></div>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">隐私和安全</div>
        <div class="settings-item">
          <div class="settings-item-info"><h3>允许回复</h3><p>控制谁能回复你的帖子</p></div>
          <select style="background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:14px">
            <option>所有人</option><option>关注的人</option><option>仅限提及</option>
          </select>
        </div>
        <div class="settings-item" onclick="this.querySelector('.settings-toggle').classList.toggle('on')">
          <div class="settings-item-info"><h3>标记为敏感内容</h3><p>在你发布的图片和视频上添加警告</p></div>
          <button class="settings-toggle"></button>
        </div>
        <div class="settings-item" onclick="this.querySelector('.settings-toggle').classList.toggle('on')">
          <div class="settings-item-info"><h3>显示浏览记录</h3><p>其他人能看到你浏览了哪些帖子</p></div>
          <button class="settings-toggle on"></button>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">通知</div>
        <div class="settings-item" onclick="this.querySelector('.settings-toggle').classList.toggle('on')">
          <div class="settings-item-info"><h3>新回复通知</h3><p>有人回复你的帖子时通知</p></div>
          <button class="settings-toggle on"></button>
        </div>
        <div class="settings-item" onclick="this.querySelector('.settings-toggle').classList.toggle('on')">
          <div class="settings-item-info"><h3>新粉丝通知</h3><p>有人关注你时通知</p></div>
          <button class="settings-toggle on"></button>
        </div>
        <div class="settings-item" onclick="this.querySelector('.settings-toggle').classList.toggle('on')">
          <div class="settings-item-info"><h3>私信通知</h3><p>收到私信时通知</p></div>
          <button class="settings-toggle on"></button>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">内容</div>
        <div class="settings-item">
          <div class="settings-item-info"><h3>语言</h3><p>中文</p></div>
          <svg width="20" height="20" fill="var(--text2)" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">开发者</div>
        <div class="settings-item">
          <div class="settings-item-info"><h3>版本</h3><p>言 v1.0.0</p></div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info"><h3>GitHub</h3><p>coolkun999/yan</p></div>
          <svg width="20" height="20" fill="var(--text2)" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </div>
      </div>
    </div>
  `;
}
function setTheme(theme,el){
  state.theme=theme;
  document.querySelectorAll('.theme-opt').forEach(e=>e.classList.remove('active'));
  el.classList.add('active');
  document.documentElement.className='';
  if(theme==='light') document.documentElement.classList.add('theme-light');
  if(theme==='dim') document.documentElement.classList.add('theme-dim');
}

// ===== SEARCH =====
function renderSearch(q=''){
  const main = document.getElementById('mainContent');
  const results = q?DB.tweets.filter(t=>t.text.includes(q)||t.name.includes(q)||t.handle.includes(q)):[];
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div style="flex:1">
          <div class="search-box" style="position:static;padding:0">
            <div class="sbw">
              <svg viewBox="0 0 24 24"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5z"/></svg>
              <input class="sin" placeholder="搜索" id="searchInput" value="${q}" oninput="doSearch(this.value)" onkeydown="if(event.key==='Enter')doSearch(this.value)">
            </div>
          </div>
        </div>
      </div>
    </div>
    ${q?`<div style="padding:12px 16px;font-size:14px;color:var(--text2)">"${q}" 的搜索结果 · ${results.length} 条</div>`:''}
    ${q&&results.length===0?'<div class="empty-state"><h3>未找到结果</h3><p>试试其他关键词</p></div>':
      (q?results.map(t=>renderTweet(t)).join(''):
      `<div class="empty-state"><h3>搜索「言」</h3><p>输入关键词搜索帖子、用户或话题</p></div>
      ${state.searchHistory&&state.searchHistory.length>0?`<div style="padding:12px 16px"><div style="display:flex;justify-content:space-between;align-items:center;padding:0 0 12px"><div style="font-size:15px;font-weight:700">搜索历史</div><button onclick="state.searchHistory=[];renderSearch()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:13px">清除</button></div>${state.searchHistory.map(k=>`<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)"><svg viewBox="0 0 24 24" width="16" height="16" fill="var(--text2)"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg><span style="flex:1;cursor:pointer" onclick="document.getElementById('searchInput').value='${k}';navigate('search','${k}')">${k}</span><button onclick="event.stopPropagation();state.searchHistory=state.searchHistory.filter(h=>h!=='${k}');renderSearch()" style="background:none;border:none;color:var(--text2);cursor:pointer">✕</button></div>`).join('')}</div>`:''}
      <div style="padding:12px 16px"><div class="wt" style="padding:0 0 12px">推荐搜索</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${['AI大模型','前端开发','Vue 4.0','创业','科技新闻'].map(k=>`<div style="background:var(--bg2);padding:8px 16px;border-radius:20px;font-size:14px;cursor:pointer" onclick="document.getElementById('searchInput').value='${k}';navigate('search','${k}')">${k}</div>`).join('')}
        </div>
      </div>`
    )}
  `;
}
function doSearch(q){if(q.length>1){if(!state.searchHistory)state.searchHistory=[];state.searchHistory=state.searchHistory.filter(h=>h!==q);state.searchHistory.unshift(q);state.searchHistory=state.searchHistory.slice(0,10);navigate('search',q);}}

// ===== TRENDING =====
function renderTrending(){
  const main = document.getElementById('mainContent');
  const trends = [
    {cat:'科技',name:'#AI大模型',count:'12.3万'}, {cat:'娱乐',name:'#新剧热播',count:'9.8万'},
    {cat:'体育',name:'#世界杯预选赛',count:'7.2万'}, {cat:'财经',name:'#A股行情',count:'5.6万'},
    {cat:'科技',name:'#开源项目',count:'4.3万'}, {cat:'游戏',name:'#黑神话悟空',count:'3.9万'},
    {cat:'科技',name:'#Vue4发布',count:'3.2万'}, {cat:'娱乐',name:'#电影推荐',count:'2.8万'},
    {cat:'财经',name:'#比特币',count:'2.5万'}, {cat:'体育',name:'#NBA',count:'2.1万'}
  ];
  main.innerHTML = `
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">热门话题</div>
      </div>
    </div>
    ${trends.map(t=>`
      <div class="trend-item" style="padding:16px">
        <div class="tm">${t.cat} 趋势</div>
        <div class="tn2" style="font-size:18px">${t.name}</div>
        <div class="tc">${t.count} 条帖子</div>
      </div>
    `).join('')}
  `;
}

// ===== LISTS =====
const LISTS_DATA = [
  {id:1,name:'前端开发者',members:1234,description:'分享前端技术和最佳实践',following:false},
  {id:2,name:'AI爱好者',members:5678,description:'人工智能相关讨论',following:true},
  {id:3,name:'创业者联盟',members:901,description:'创业者和投资人社区',following:false}
];
function renderLists(){
  const main = document.getElementById('mainContent');
  main.innerHTML=`
    <div class="ct">
      <div class="main-header" style="justify-content:space-between">
        <div style="display:flex;align-items:center;gap:20px">
          <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
          <div class="page-title">列表</div>
        </div>
        <button class="back-btn" onclick="openCreateListModal()" title="创建列表">
          <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>
    </div>
    <div class="profile-tabs" style="border-top:none">
      <div class="profile-tab active">已加入</div>
      <div class="profile-tab">订阅</div>
    </div>
    ${LISTS_DATA.filter(l=>l.following).length>0?LISTS_DATA.filter(l=>l.following).map(l=>`
      <div class="fi" style="padding:16px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-weight:700;font-size:16px">${l.name}</span>
          </div>
          <div style="font-size:14px;color:var(--text2);margin-top:2px">${l.members.toLocaleString()} 位成员 · ${l.description}</div>
        </div>
        <button class="fbtn following" onclick="toggleListFollow(this)">正在关注</button>
      </div>
    `).join(''):'<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg><h3>还没有加入的列表</h3><p>发现并加入有趣的列表</p></div>'}
    <div style="padding:16px 16px 8px;border-bottom:1px solid var(--border)">
      <div style="font-size:15px;font-weight:700">推荐列表</div>
    </div>
    ${LISTS_DATA.filter(l=>!l.following).map(l=>`
      <div class="fi" style="padding:16px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-weight:700;font-size:16px">${l.name}</span>
          </div>
          <div style="font-size:14px;color:var(--text2);margin-top:2px">${l.members.toLocaleString()} 位成员 · ${l.description}</div>
        </div>
        <button class="fbtn" onclick="toggleListFollow(this)">关注</button>
      </div>
    `).join('')}
  `;
}
function toggleListFollow(btn){
  if(btn.classList.contains('following')){
    btn.classList.remove('following');
    btn.classList.add('fbtn');
    btn.textContent='关注';
    btn.style.cssText='';
  } else {
    btn.classList.add('following');
    btn.textContent='正在关注';
    btn.style.cssText='background:transparent;color:var(--text);border:1px solid var(--border);border-radius:9999px;padding:7px 18px;font-size:14px;font-weight:700';
  }
}
function openCreateListModal(){
  alert('创建列表功能即将上线');
}

// ===== TOPICS =====
const TOPICS_DATA = [
  {name:'AI大模型',posts:'1.2万',following:false,icon:'🤖'},
  {name:'前端开发',posts:'8.9千',following:true,icon:'💻'},
  {name:'创业故事',posts:'5.6千',following:false,icon:'🚀'},
  {name:'科技新闻',posts:'2.3万',following:true,icon:'📰'},
  {name:'生活方式',posts:'1.8万',following:false,icon:'✨'},
  {name:'产品设计',posts:'3.4千',following:false,icon:'🎨'},
  {name:'投资理财',posts:'6.7千',following:false,icon:'💰'},
  {name:'游戏电竞',posts:'4.5千',following:false,icon:'🎮'},
  {name:'电影推荐',posts:'7.8千',following:true,icon:'🎬'},
  {name:'健康生活',posts:'2.1千',following:false,icon:'💪'}
];
function renderTopics(){
  const main = document.getElementById('mainContent');
  const followingTopics = TOPICS_DATA.filter(t=>t.following);
  main.innerHTML=`
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('home')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div class="page-title">话题</div>
      </div>
    </div>
    ${followingTopics.length>0?`
      <div style="padding:12px 16px 8px">
        <div style="font-size:13px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:8px">你关注的话题</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${followingTopics.map(t=>`<div class="trend-item" style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:var(--bg2);border-radius:20px" onclick="navigate('trending')">${t.icon}<span style="font-size:14px;font-weight:600">${t.name}</span></div>`).join('')}
        </div>
      </div>
    `:''}
    <div style="padding:12px 16px 8px">
      <div style="font-size:13px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:8px">推荐话题</div>
    </div>
    <div style="padding:0 16px">
      ${TOPICS_DATA.map(t=>`
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:24px">${t.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:15px">${t.name}</div>
            <div style="font-size:13px;color:var(--text2)">${t.posts} 条帖子</div>
          </div>
          <button class="${t.following?'fbtn following':'fbtn'}" onclick="toggleTopicFollow(this,'${t.name}')">${t.following?'正在关注':'关注'}</button>
        </div>
      `).join('')}
    </div>
  `;
}
function toggleTopicFollow(btn,topic){
  const t = TOPICS_DATA.find(x=>x.name===topic);
  if(t) t.following=!t.following;
  if(btn.classList.contains('following')){
    btn.classList.remove('following');
    btn.classList.add('fbtn');
    btn.textContent='关注';
    btn.style.cssText='';
  } else {
    btn.classList.add('following');
    btn.textContent='正在关注';
    btn.style.cssText='background:transparent;color:var(--text);border:1px solid var(--border);border-radius:9999px;padding:7px 18px;font-size:14px;font-weight:700';
  }
}

function renderTopicPage(topic){
  const main = document.getElementById('mainContent');
  const tweets = DB.tweets.filter(t => t.text.includes(topic) || t.name.includes(topic));
  main.innerHTML=`
    <div class="ct">
      <div class="main-header">
        <button class="back-btn" onclick="navigate('topics')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
        <div>
          <div class="page-title">${topic}</div>
          <div style="font-size:13px;color:var(--text2)">话题</div>
        </div>
      </div>
    </div>
    <div style="padding:16px;border-bottom:1px solid var(--border)">
      <div style="font-size:14px;color:var(--text2);line-height:1.6">关注此话题，获取相关内容最新动态</div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="fbtn" onclick="navigate('topics')">返回话题列表</button>
        <button class="fbtn following" onclick="this.textContent=this.textContent==='正在关注'?'关注':'正在关注';this.style.background=this.textContent==='正在关注'?'transparent':'var(--text)';this.style.color=this.textContent==='正在关注'?'var(--text)':'var(--bg)';this.style.borderColor=this.textContent==='正在关注'?'var(--border)':'transparent'">正在关注</button>
      </div>
    </div>
    ${tweets.length>0?`<div class="feed">${tweets.map(t=>renderTweetHTML(t)).join('')}</div>`:'<div class="empty-state" style="padding:40px 0"><h3>暂无相关帖子</h3><p>成为第一个讨论这个话题的人吧！</p></div>'}
  `;
}

// ===== FOLLOWING / FOLLOWERS =====
const FOLLOWING_DATA = [
  {name:'林小雨',handle:'@linxiaoyu',bio:'产品经理 / AI爱好者',avatar:'林',avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',verified:true,following:true},
  {name:'科技日报',handle:'@techdaily',bio:'第一时间报道科技前沿资讯',avatar:'科',avatarBg:'linear-gradient(135deg,#f093fb,#f5576c)',verified:true,following:true},
  {name:'张伟',handle:'@zhangwei',bio:'产品经理 / AI创业者',avatar:'张',avatarBg:'linear-gradient(135deg,#4facfe,#00f2fe)',verified:false,following:true},
  {name:'李娜',handle:'@lina_tech',bio:'全栈工程师 / 开源贡献者',avatar:'李',avatarBg:'linear-gradient(135deg,#43e97b,#38f9d7)',verified:false,following:true},
  {name:'前端开发者社区',handle:'@fe_community',bio:'分享前端技术和最佳实践',avatar:'前',avatarBg:'linear-gradient(135deg,#fa709a,#fee140)',verified:true,following:false}
];
const FOLLOWERS_DATA = [
  {name:'王珊珊',handle:'@wangshanshan',bio:'设计师',avatar:'王',avatarBg:'linear-gradient(135deg,#fa709a,#fee140)',verified:false,following:false},
  {name:'陈明',handle:'@chenming_ai',bio:'AI研究员',avatar:'陈',avatarBg:'linear-gradient(135deg,#43e97b,#38f9d7)',verified:true,following:true},
  {name:'诗雅',handle:'@shiya',bio:'自由撰稿人',avatar:'诗',avatarBg:'linear-gradient(135deg,#f093fb,#f5576c)',verified:false,following:false}
];
function renderFollowing(){
  const main = document.getElementById('mainContent');
  main.innerHTML=`
    <div class="ct">
      <div class="main-header" style="justify-content:space-between">
        <div style="display:flex;align-items:center;gap:20px">
          <button class="back-btn" onclick="navigate('profile')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
          <div>
            <div style="font-size:17px;font-weight:800">王坤</div>
            <div style="font-size:13px;color:var(--text2)">${state.user.following} 正在关注</div>
          </div>
        </div>
      </div>
    </div>
    ${FOLLOWING_DATA.map(u=>renderFollowItem(u)).join('')}
    ${FOLLOWING_DATA.length===0?'<div class="empty-state"><h3>还没有关注任何人</h3><p>关注更多人，发现精彩内容</p></div>':''}
  `;
}
function renderFollowers(){
  const main = document.getElementById('mainContent');
  main.innerHTML=`
    <div class="ct">
      <div class="main-header" style="justify-content:space-between">
        <div style="display:flex;align-items:center;gap:20px">
          <button class="back-btn" onclick="navigate('profile')"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
          <div>
            <div style="font-size:17px;font-weight:800">王坤</div>
            <div style="font-size:13px;color:var(--text2)">${state.user.followers} 关注者</div>
          </div>
        </div>
      </div>
    </div>
    ${FOLLOWERS_DATA.map(u=>renderFollowItem(u)).join('')}
    ${FOLLOWERS_DATA.length===0?'<div class="empty-state"><h3>还没有关注者</h3><p>分享你的内容，吸引关注</p></div>':''}
  `;
}
function renderFollowItem(u){
  return `
    <div class="fi" style="padding:16px">
      <div class="fa" style="background:${u.avatarBg};width:48px;height:48px;font-size:18px;cursor:pointer" onclick="navigate('user','${u.handle}')">${u.avatar}</div>
      <div class="fi-info" style="flex:1">
        <div class="fi-name" onclick="navigate('user','${u.handle}')">${u.name}${u.verified?'<span style="color:var(--accent);display:inline-flex"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="var(--accent)" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.441c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"/></svg></span>':''}</div>
        <div class="fi-handle">${u.handle}</div>
        <div style="font-size:14px;color:var(--text2);margin-top:4px">${u.bio}</div>
      </div>
      <button class="${u.following?'fbtn following':'fbtn'}" onclick="toggleFollowItem(this,'${u.handle}')">${u.following?'正在关注':'关注'}</button>
    </div>
  `;
}
function toggleFollowItem(btn,handle){
  const allUsers = [...FOLLOWING_DATA, ...FOLLOWERS_DATA];
  const user = allUsers.find(u=>u.handle===handle);
  if(user) user.following=!user.following;
  if(btn.classList.contains('following')){
    btn.classList.remove('following');
    btn.classList.add('fbtn');
    btn.textContent='关注';
    btn.style.cssText='';
  } else {
    btn.classList.add('following');
    btn.textContent='正在关注';
    btn.style.cssText='background:transparent;color:var(--text);border:1px solid var(--border);border-radius:9999px;padding:7px 18px;font-size:14px;font-weight:700';
    btn.onmouseout=function(){this.style.cssText='background:transparent;color:var(--text);border:1px solid var(--border);border-radius:9999px;padding:7px 18px;font-size:14px;font-weight:700'};
  }
}

// ===== LIKERS LIST =====
function openLikersModal(){
  const body = document.getElementById('likersListBody');
  if(DB.likersList.length===0){
    body.innerHTML='<div class="empty-state"><h3>还没有人喜欢</h3></div>';
  } else {
    body.innerHTML = DB.likersList.map(u=>`
      <div class="liker-item">
        <div class="ta" style="background:${u.avatarBg};width:40px;height:40px;font-size:16px;cursor:pointer" onclick="closeLikersModal();navigate('user','${u.handle}')">${u.avatar}</div>
        <div style="flex:1;min-width:0;cursor:pointer" onclick="closeLikersModal();navigate('user','${u.handle}')">
          <div style="display:flex;align-items:center;gap:4px">
            <span style="font-weight:700;font-size:15px">${u.name}</span>
            ${u.verified?'<svg width="14" height="14" viewBox="0 0 24 24"><path fill="var(--accent)" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.441c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"/></svg>':''}
          </div>
          <div style="color:var(--text2);font-size:14px">${u.handle}</div>
        </div>
        <button class="${u.following?'fbtn following':'fbtn'}" onclick="toggleLikerFollow(this,'${u.handle}')">${u.following?'正在关注':'关注'}</button>
      </div>
    `).join('');
  }
  document.getElementById('likersModal').classList.add('active');
}

// ===== NEW MESSAGE =====
function openNewMsgModal(){
  document.getElementById('newMsgModal').classList.add('active');
  setTimeout(()=>document.getElementById('newMsgRecipient').focus(),50);
}
function closeNewMsgModal(){
  document.getElementById('newMsgModal').classList.remove('active');
  document.getElementById('newMsgRecipient').value='';
  document.getElementById('newMsgText').value='';
}
function startNewMessage(){
  const recipient = document.getElementById('newMsgRecipient').value.trim();
  const text = document.getElementById('newMsgText').value.trim();
  if(!recipient){
    alert('请输入用户名');
    return;
  }
  // Create or find conversation
  const existingMsg = DB.messages.find(m=>m.handle==='@'+recipient);
  if(existingMsg){
    closeNewMsgModal();
    navigate('messages');
    setTimeout(()=>openChat(existingMsg.id),100);
    return;
  }
  const newId = Date.now();
  const newMsg = {
    id:newId,
    name:recipient,
    handle:'@'+recipient,
    avatar:recipient[0]?.toUpperCase()||'?',
    avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',
    preview:text||'开始对话...',
    time:'刚刚',
    unread:0,
    messages:text?[{sent:true,text,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}]:[]
  };
  DB.messages.unshift(newMsg);
  closeNewMsgModal();
  navigate('messages');
  if(text) setTimeout(()=>openChat(newId),100);
}
function closeLikersModal(){
  document.getElementById('likersModal').classList.remove('active');
}
function toggleLikerFollow(btn,handle){
  const user = DB.likersList.find(u=>u.handle===handle);
  if(user) user.following=!user.following;
  if(btn.classList.contains('following')){
    btn.classList.remove('following');
    btn.classList.add('fbtn');
    btn.textContent='关注';
    btn.style.cssText='';
  } else {
    btn.classList.add('following');
    btn.textContent='正在关注';
    btn.style.cssText='background:transparent;color:var(--text);border:1px solid var(--border);border-radius:9999px;padding:7px 18px;font-size:14px;font-weight:700';
    btn.onmouseout=function(){this.style.cssText='background:transparent;color:var(--text);border:1px solid var(--border);border-radius:9999px;padding:7px 18px;font-size:14px;font-weight:700'};
  }
}

// ===== AUTH =====
let authMode = 'login';
function renderAuth(){
  authMode = 'login';
  document.getElementById('sidebar').style.display='none';
  document.getElementById('sidebarRight').style.display='none';
  const auth = document.getElementById('authPage');
  auth.classList.add('active');
  auth.innerHTML=renderAuthForm();
}
function renderAuthForm(){
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">言</div>
        <h1 class="auth-title">${authMode==='login'?'登录到你的账号':'创建账号'}</h1>
        <p class="auth-sub">${authMode==='login'?'欢迎回来！':'加入「言」，开始你的社交之旅'}</p>
        <div class="auth-inputs">
          ${authMode==='login'?`
            <div class="ail"><label>用户名或邮箱</label><input type="text" id="loginUser" placeholder="请输入用户名或邮箱"></div>
            <div class="ail"><label>密码</label><input type="password" id="loginPass" placeholder="请输入密码"></div>
          `:`<div class="ail"><label>姓名</label><input type="text" id="regName" placeholder="请输入你的姓名"></div>
            <div class="ail"><label>用户名</label><input type="text" id="regHandle" placeholder="请输入用户名（不含@）"></div>
            <div class="ail"><label>邮箱</label><input type="email" id="regEmail" placeholder="请输入邮箱"></div>
            <div class="ail"><label>密码</label><input type="password" id="regPass" placeholder="设置密码（至少8位）"></div>`}
          <div class="auth-err" id="authErr"></div>
          <button class="abtn" onclick="handleAuth()">${authMode==='login'?'登录':'注册'}</button>
        </div>
        <div class="auth-divider">或者</div>
        <button class="abtn" style="background:#fff;color:#000;border:1px solid var(--border)" onclick="handleGoogleAuth()"><svg style="width:18px;height:18px;vertical-align:middle;margin-right:8px" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> 使用 Google 继续</button>
        <div class="auth-switch" onclick="authMode=authMode==='login'?'register':'login';document.getElementById('authPage').innerHTML=renderAuthForm()">
          ${authMode==='login'?'没有账号？注册':'已有账号？登录'}
        </div>
      </div>
    </div>
  `;
}
function handleAuth(){
  const err = document.getElementById('authErr');
  if(authMode==='login'){
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value;
    if(!u||!p){err.style.display='block';err.textContent='请填写所有字段';return}
    err.style.display='none';
    state.currentUser={name:'王坤',handle:'@wngkn5393218313'};
    navigate('home');
  } else {
    const name = document.getElementById('regName').value.trim();
    const handle = document.getElementById('regHandle').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    if(!name||!handle||!email||!pass){err.style.display='block';err.textContent='请填写所有字段';return}
    if(pass.length<8){err.style.display='block';err.textContent='密码至少8位';return}
    err.style.display='none';
    state.currentUser={name,handle:'@'+handle};
    navigate('home');
  }
}
function handleGoogleAuth(){
  state.currentUser={name:'王坤',handle:'@wngkn5393218313'};
  navigate('home');
}

// ===== INTERACTIONS =====
function doLike(id,btn){
  if(!requireLogin()) return;
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  t.liked=!t.liked;
  t.likes+=t.liked?1:-1;
  LS.save();
  btn.classList.toggle('liked',t.liked);
  const lk=document.getElementById('lk-'+id);
  if(lk)lk.textContent=f(t.likes);
}
function doRetweet(id,btn){
  if(!requireLogin()) return;
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  // 弹出选择：普通转推 or 引用转推
  showRetweetMenu(id,btn);
}
function showRetweetMenu(id,btn){
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  // 移除已有的菜单
  document.querySelectorAll('.rt-menu').forEach(m=>m.remove());
  const menu=document.createElement('div');
  menu.className='rt-menu';
  menu.style.cssText='position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:var(--bg3);border:1px solid var(--border);border-radius:12px;overflow:hidden;z-index:300;min-width:180px;box-shadow:0 4px 12px rgba(0,0,0,.4);margin-bottom:4px';
  menu.innerHTML=`
    <div class="d-item" onclick="doNormalRetweet(${id});this.parentElement.remove()"><svg viewBox="0 0 24 24" fill="var(--green)"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88z"/></svg> 转推</div>
    <div class="d-item" onclick="openQuoteModal(${id});this.parentElement.remove()"><svg viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg> 引用转推</div>
  `;
  btn.style.position='relative';
  btn.appendChild(menu);
  setTimeout(()=>{document.addEventListener('click',function rm(e){if(!menu.contains(e.target)){menu.remove();document.removeEventListener('click',rm)}}) },10);
}
function doNormalRetweet(id){
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  t.retweeted=!t.retweeted;
  t.retweets+=t.retweeted?1:-1;
  LS.save();
  // 刷新当前页面以更新UI
  if(state.currentPage==='home')renderHome();
  else if(state.currentPage==='post')renderPostDetail(id);
  else if(state.currentPage==='profile')renderProfile();
  else if(state.currentPage==='bookmarks')renderBookmarks();
  else if(state.currentPage==='explore')renderExplore();
}
function openQuoteModal(id){
  state.quoteTweetId=id;
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  // 预览引用的帖子
  const preview=document.getElementById('quotePreview');
  preview.innerHTML=`
    <div class="quote-preview-card" style="padding:12px;border:1px solid var(--border);border-radius:16px;cursor:pointer">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <div class="ta" style="background:${t.avatarBg};width:20px;height:20px;font-size:10px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">${t.avatar}</div>
        <span style="font-weight:700;font-size:13px">${t.name}</span>
        <span style="color:var(--text2);font-size:13px">${t.handle}</span>
      </div>
      <div style="font-size:14px;color:var(--text);line-height:1.5;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${t.text}</div>
    </div>
  `;
  document.getElementById('quoteModal').classList.add('active');
  setTimeout(()=>document.getElementById('quoteText').focus(),50);
}
function closeQuoteModal(){
  document.getElementById('quoteModal').classList.remove('active');
  document.getElementById('quoteText').value='';
  document.getElementById('quotePostBtn').disabled=true;
  document.getElementById('quotePreview').innerHTML='';
  state.quoteTweetId=null;
}
function updateQuoteBtn(){
  document.getElementById('quotePostBtn').disabled=document.getElementById('quoteText').value.trim().length===0;
}
function submitQuoteRetweet(){
  const text=document.getElementById('quoteText').value.trim();
  const quoteId=state.quoteTweetId;
  if(!text||!quoteId)return;
  const qt=DB.tweets.find(x=>x.id===quoteId);
  if(!qt)return;
  const viewsOptions=['15','28','47','89','124'];
  const t={id:Date.now(),name:'王坤',handle:'@wngkn5393218313',verified:false,time:'刚刚',text,avatar:'王',avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',likes:0,retweets:0,replies:0,views:viewsOptions[Math.floor(Math.random()*viewsOptions.length)],liked:false,retweeted:false,bookmarked:false,quoteTweet:quoteId};
  DB.tweets.unshift(t);
  // 增加原帖转推数
  qt.retweets++;
  LS.save();
  closeQuoteModal();
  if(state.currentPage==='home')renderHome();
  else if(state.currentPage==='post')renderPostDetail(quoteId);
}
function toggleFollow(btn){
  if(!requireLogin()) return;
  btn.textContent=btn.textContent==='关注'?'正在关注':'关注';
  btn.classList.toggle('following',btn.textContent==='正在关注');
}
function openReplyModal(id){
  if(!requireLogin()) return;
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  openPostModal();
  document.getElementById('modalText').value='@'+t.handle.replace('@','')+' ';
}
function openPostModal(){
  if(!requireLogin()) return;
  document.getElementById('postModal').classList.add('active');
  setTimeout(()=>document.getElementById('modalText').focus(),50);
}
function closePostModal(){
  document.getElementById('postModal').classList.remove('active');
  document.getElementById('modalText').value='';
  document.getElementById('modalPostBtn').disabled=true;
}
function updateModalPostBtn(){
  const v=document.getElementById('modalText').value.trim();
  document.getElementById('modalPostBtn').disabled=v.length===0;
}
function submitPost(){
  if(!requireLogin()) return;
  const v=document.getElementById('modalText').value.trim();
  if(!v)return;
  const viewsOptions=['12','32','58','103','156','234'];
  const t={id:Date.now(),name:'王坤',handle:'@wngkn5393218313',verified:false,time:'刚刚',text:v,avatar:'王',avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',likes:0,retweets:0,replies:0,views:viewsOptions[Math.floor(Math.random()*viewsOptions.length)],liked:false,retweeted:false,bookmarked:false};
  DB.tweets.unshift(t);
  LS.save();
  closePostModal();
  if(state.currentPage==='home'){renderHome();}
}
function openShareModal(id){
  document.getElementById('shareModal').classList.add('active');
  document.getElementById('shareUrlText').textContent='https://yanyan.com/post/'+id;
}
function closeShareModal(){document.getElementById('shareModal').classList.remove('active')}
function copyShareUrl(){
  navigator.clipboard.writeText(document.getElementById('shareUrlText').textContent).then(()=>{
    const btn=document.querySelector('.copy-btn');
    btn.textContent='已复制！';
    setTimeout(()=>btn.textContent='复制链接',1500);
  });
}
function openMoreMenu(id,event){
  const body=document.getElementById('moreModalBody');
  const t=DB.tweets.find(x=>x.id===id);
  const isMine = t && t.handle === '@wngkn5393218313';
  body.innerHTML=`
    <div class="d-item" onclick="toggleBookmarkFromMore(${id});closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg> ${t&&t.bookmarked?'从书签中移除':'添加到书签'}</div>
    ${isMine ? `
    <div class="d-divider"></div>
    <div class="d-item" onclick="pinTweet(${id});closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg> ${t&&t.pinned?'取消置顶':'置顶帖子'}</div>
    <div class="d-item" onclick="editTweet(${id});closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> 修改帖子</div>
    <div class="d-item" onclick="changeWhoCanReply(${id});closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg> 谁可以回复</div>
    <div class="d-divider"></div>
    <div class="d-item danger" onclick="deleteTweet(${id});closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg> 删除帖子</div>
    ` : `
    <div class="d-divider"></div>
    <div class="d-item" onclick="closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm2.07-7.75l-.9.92C12.45 11.9 12 13.5 12 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg> 不感兴趣</div>
    <div class="d-item" onclick="muteUser('${t?t.handle:''}');closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg> 屏蔽 @${t?t.handle:''}</div>
    <div class="d-item" onclick="blockUser('${t?t.handle:''}');closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 014 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0120 12c0 4.42-3.58 8-8 8z"/></svg> 屏蔽 @${t?t.handle:''}</div>
    <div class="d-item" onclick="closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg> 举报帖子</div>
    `}
    <div class="d-divider"></div>
    <div class="d-item" onclick="copyTweetLink(${id});closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> 复制链接</div>
    <div class="d-item" onclick="navigate('user','${t?t.handle:''}');closeMoreMenu()"><svg viewBox="0 0 24 24"><path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19z"/></svg> 查看个人资料</div>
  `;
  document.getElementById('moreModal').classList.add('active');
}
function pinTweet(id){
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  // 取消其他置顶
  DB.tweets.forEach(x=>{if(x.pinned)x.pinned=false});
  t.pinned=!t.pinned;
  LS.save();
  if(state.currentPage==='home')renderHome();
  else if(state.currentPage==='profile')renderProfile();
}
function editTweet(id){
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  openPostModal();
  state.editingTweetId=id;
  document.getElementById('modalText').value=t.text;
  document.getElementById('modalPostBtn').textContent='修改';
  updateModalPostBtn();
}
function muteUser(handle){
  // 模拟屏蔽用户
  alert('已屏蔽 @'+handle);
}
function blockUser(handle){
  // 模拟拉黑用户
  alert('已屏蔽 @'+handle);
}
function changeWhoCanReply(id){
  alert('此功能即将上线');
}
function closeMoreMenu(){document.getElementById('moreModal').classList.remove('active')}
function toggleBookmarkFromMore(id){
  const t=DB.tweets.find(x=>x.id===id);
  if(!t)return;
  t.bookmarked=!t.bookmarked;
  if(t.bookmarked){if(!DB.bookmarks.includes(id))DB.bookmarks.push(id);}else{DB.bookmarks=DB.bookmarks.filter(x=>x!==id);}
  LS.save();
  openMoreMenu(id,event);
}
function copyTweetLink(id){openShareModal(id)}
function deleteTweet(id){
  DB.tweets=DB.tweets.filter(x=>x.id!==id);
  LS.save();
  document.getElementById('tweet-'+id)?.remove();
}
function toggleDropdown(id){
  const el=document.getElementById(id);
  const wasActive=el.classList.contains('active');
  closeAllDropdowns();
  if(!wasActive)el.classList.add('active');
}
function closeAllDropdowns(){
  document.querySelectorAll('.dropdown').forEach(d=>d.classList.remove('active'));
}

// ===== EMOJI PICKER =====
const EMOJIS='😀 😃 😄 😁 😅 😂 🙂 😉 😊 😍 🤩 😘 😎 🥳 🤗 🤔 🧐 😇 😈 🤡 💀 👻 🙈 🙉 🙊 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 🌸 🌺 🌻 🌼 🌷 🌹 🍀 🍎 🍕 🍜 🍣 🍦 🍰 ☕ 🍵 🚀 ✈️ 🏠 💼 📱 💻 🎮 🎬 🎵 🎨 📚 🏆 ⚽ 🏀 🏃 💪 🏋️ 🧘 🧠 💡 🔥 ✨ 💫 🌈 ⭐ 🌍 🎉 🎊 ✅ ❌ ⚠️ 🔔 📣 💬 🗣️ 👀 👋 🤝 👏 🙌 🎯 🎁 🏷️ 📌 ⚡ 🌙 ☀️ ⭐ 💰 💳 🎁 📊 📈 📉 🔒 🔓 💳 ✏️ 📝 🖊️ 📸 📷 🎥 📹 🎙️ 📻 🧲 🔍 💡 🛠️ ⚙️ 🔧 🧰 💊 🩺 🏥 🌡️ 🤒 😷';
let emojiPickerInit=false;
function initEmojiPicker(){
  if(emojiPickerInit)return;
  emojiPickerInit=true;
  const picker=document.getElementById('emojiPicker');
  if(!picker)return;
  EMOJIS.split(' ').filter(e=>e).forEach(e=>{
    const btn=document.createElement('button');
    btn.className='emoji-btn';
    btn.textContent=e;
    btn.onclick=()=>insertEmoji(e);
    picker.appendChild(btn);
  });
}
function toggleEmoji(){
  const picker=document.getElementById('emojiPicker');
  if(!picker)return;
  picker.classList.toggle('active');
}
function insertEmoji(e){
  const ta=document.querySelector('.cin:focus,.ri-textarea:focus,#modalText:focus');
  if(ta){
    const s=ta.selectionStart||ta.value.length;
    ta.value=ta.value.slice(0,s)+e+ta.value.slice(s);
    ta.selectionStart=ta.selectionEnd=s+e.length;
    ta.focus();
    if(ta.id==='modalText')updateModalPostBtn();
  }
  document.getElementById('emojiPicker')?.classList.remove('active');
}

// ===== CLICK OUTSIDE =====
document.addEventListener('click',function(e){
  if(!e.target.closest('.dropdown')&&!e.target.closest('[onclick*="toggleDropdown"]')&&!e.target.closest('#userMenu')){
    closeAllDropdowns();
  }
  if(!e.target.closest('#postModal')&&!e.target.closest('.post-btn')&&!e.target.closest('#modalPostBtn')){
    // don't close modal from outside
  }
  if(!e.target.closest('#shareModal'))closeShareModal();
  if(!e.target.closest('#moreModal')&&!e.target.closest('.more-btn'))closeMoreMenu();
  if(!e.target.closest('#likersModal')&&!e.target.closest('.likers-trigger'))closeLikersModal();
  if(!e.target.closest('#quoteModal')&&!e.target.closest('.ab.rt'))closeQuoteModal();
  // 关闭转推下拉菜单
  if(!e.target.closest('.rt-menu')&&!e.target.closest('.ab.rt'))document.querySelectorAll('.rt-menu').forEach(m=>m.remove());
});

// ===== INFINITE SCROLL =====
let scrollTimer = null;
window.addEventListener('scroll', function(){
  if(scrollTimer) return;
  scrollTimer = setTimeout(()=>{
    scrollTimer = null;
    const scrollBottom = window.innerHeight + window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const threshold = 200; // 距离底部200px时触发

    if(docHeight - scrollBottom < threshold){
      if(state.currentPage === 'home' && state.homeHasMore){
        loadMoreHome();
      }
    }
  }, 150);
});

// ===== INIT =====
navigate('home');

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    closePostModal();
    closeShareModal();
    closeMoreMenu();
    closeQuoteModal();
    closeLikersModal();
    closeAllDropdowns();
    document.querySelectorAll('.rt-menu').forEach(m=>m.remove());
  }
  if(e.key==='n'&&!e.ctrlKey&&!e.metaKey&&!e.target.closest('input,textarea')){
    openPostModal();
  }
  if(e.key==='/'&&!e.target.closest('input,textarea')){
    e.preventDefault();
    navigate('search');
  }
  if(e.key==='g'&&!e.target.closest('input,textarea')){
    if(e.ctrlKey||e.metaKey)return;
    navigate('home');
  }
  if(e.key==='r'&&!e.target.closest('input,textarea')){
    navigate('notifications');
  }
  if(e.key==='m'&&!e.target.closest('input,textarea')){
    navigate('messages');
  }
  if(e.key==='p'&&!e.target.closest('input,textarea')){
    navigate('profile');
  }
});