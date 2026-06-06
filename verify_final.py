import subprocess
local = r'C:\Users\王坤\.openclaw\workspace\yan\js\app.js'
r = subprocess.run(['scp', local, 'root@47.102.158.179:/var/www/yan/frontend/js/'], capture_output=True, text=True, timeout=30)
print('scp result:', r.returncode, r.stderr[:200] if r.stderr else '')

import hashlib
with open(local, 'r', encoding='utf-8') as f:
    h = hashlib.md5(f.read().encode()).hexdigest()[:12]
r2 = subprocess.run(['ssh', 'root@47.102.158.179', 'md5sum /var/www/yan/frontend/js/app.js'], capture_output=True, text=True, timeout=10)
print('Local:', h)
print('Server:', r2.stdout.strip()[:12])
