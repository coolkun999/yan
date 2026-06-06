import subprocess

# Check if the symlink is still valid
r = subprocess.run(['ssh', 'root@47.102.158.179', 'ls -la /var/www/html/yan'], capture_output=True, text=True, timeout=10)
print('Symlink:', r.stdout.strip())

# Check file sizes
r = subprocess.run(['ssh', 'root@47.102.158.179', 'wc -c /var/www/yan/frontend/js/app.js /var/www/html/yan/js/app.js'], capture_output=True, text=True, timeout=10)
print('Sizes:', r.stdout.strip())

# Force copy instead of relying on symlink
r = subprocess.run(['scp', r'C:\Users\王坤\.openclaw\workspace\yan\js\app.js', 'root@47.102.158.179:/var/www/html/yan/js/'], capture_output=True, text=True, timeout=30)
print('Direct scp to /var/www/html/yan/js/:', r.returncode)

import hashlib
with open(r'C:\Users\王坤\.openclaw\workspace\yan\js\app.js', 'r', encoding='utf-8') as f:
    h = hashlib.md5(f.read().encode()).hexdigest()[:12]
r2 = subprocess.run(['ssh', 'root@47.102.158.179', 'md5sum /var/www/html/yan/js/app.js'], capture_output=True, text=True, timeout=10)
print('Local:', h)
print('Server (html):', r2.stdout.strip()[:12])
