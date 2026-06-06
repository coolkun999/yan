import subprocess

# Verify key functions on server
checks = {
    'authLogin no local fallback': 'const result = await AuthAPI.login',
    'renderUserProfile uses API': 'UsersAPI.get(handle)',
    'renderProfile uses API': 'loadProfileContent',
    'renderPostDetail uses API': 'PostsAPI.get(id)',
    'homePost no local fallback': '服务器连接失败',
    'loadForYouFromAPI no fallback': '加载失败',
}

for name, pattern in checks.items():
    r = subprocess.run(['ssh', 'root@47.102.158.179', f'grep -c "{pattern}" /var/www/yan/frontend/js/app.js /var/www/yan/frontend/js/auth.js 2>/dev/null'], capture_output=True, text=True, timeout=10)
    found = any(int(x.split(':')[-1].strip()) > 0 for x in r.stdout.strip().split('\n') if ':' in x)
    print(f'  [{"OK" if found else "!!"}] {name}')
