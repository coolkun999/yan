/**
 * "言" 项目 - 核心工具函数测试
 * 运行: node tests/util.test.js
 */

// 测试 escapeHtml
function escapeHtml(str){
  if(!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// 测试 formatTweetText
function formatTweetText(text){
  if(!text) return '';
  const escaped = escapeHtml(text);
  const withBreaks = escaped.replace(/\n/g,'<br>');
  const withTopics = withBreaks.replace(/#(\S+)/g, function(_, tag){
    return '<a href="#" onclick="event.preventDefault();event.stopPropagation();navigate(\'topic\',\'' + encodeURIComponent(tag) + '\')" style="color:var(--accent)">#' + tag + '</a>';
  });
  return withTopics.replace(/@(\S+)/g, function(_, mention){
    return '<a href="#" onclick="event.preventDefault();event.stopPropagation();navigate(\'user\',\'' + encodeURIComponent(mention) + '\')" style="color:var(--accent)">@' + mention + '</a>';
  });
}

// ===== 简单测试框架 =====
let passed = 0, failed = 0;
function assert(condition, testName){
  if(condition){ passed++; console.log('  ✅ ' + testName); }
  else { failed++; console.log('  ❌ ' + testName); }
}

// ===== escapeHtml 测试 =====
console.log('\n[escapeHtml]');
assert(escapeHtml('') === '', '空字符串返回空');
assert(escapeHtml(null) === '', 'null 返回空');
assert(escapeHtml('<script>') === '&lt;script&gt;', '转义 <script>');
assert(escapeHtml('a & b') === 'a &amp; b', '转义 &');
assert(escapeHtml('"quoted"') === '&quot;quoted&quot;', '转义双引号');
assert(escapeHtml("it's fine") === 'it&#39;s fine', '转义单引号');

// ===== formatTweetText 测试 =====
console.log('\n[formatTweetText]');
assert(formatTweetText('') === '', '空字符串返回空');
assert(formatTweetText(null) === '', 'null 返回空');
assert(formatTweetText('Hello world') === 'Hello world', '普通文本不变');
assert(formatTweetText('Hello\nworld') === 'Hello<br>world', '换行转<br>');
assert(formatTweetText('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'XSS payload 被完全转义');
assert(formatTweetText('#topic') === '<a href="#" onclick="event.preventDefault();event.stopPropagation();navigate(\'topic\',\'topic\')" style="color:var(--accent)">#topic</a>', '话题高亮正常');
assert(formatTweetText('@username') === '<a href="#" onclick="event.preventDefault();event.stopPropagation();navigate(\'user\',\'username\')" style="color:var(--accent)">@username</a>', '@提及高亮正常');
// 恶意输入：标签内含 XSS，displayText 被转义，onclick 参数用 encodeURIComponent
assert(formatTweetText('#<script>').includes('&lt;script&gt;</a>'), '话题内 XSS displayText 被转义');
assert(formatTweetText('#<script>').includes('encodeURIComponent') || formatTweetText('#<script>').includes('navigate'), '话题内 XSS onclick 参数被编码');
assert(formatTweetText('@<script>').includes('&lt;script&gt;</a>'), '@提及内 XSS displayText 被转义');
assert(formatTweetText('@<script>').includes('encodeURIComponent') || formatTweetText('@<script>').includes('navigate'), '@提及内 XSS onclick 参数被编码');

// ===== 结果汇总 =====
console.log('\n========================================');
console.log('测试结果: ' + passed + ' 通过, ' + failed + ' 失败');
if(failed > 0) process.exit(1);
else { console.log('全部测试通过! '); process.exit(0); }