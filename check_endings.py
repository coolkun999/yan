import subprocess

# Check if it's a line ending issue
r = subprocess.run(['ssh', 'root@47.102.158.179', 'file /var/www/yan/frontend/js/app.js'], capture_output=True, text=True, timeout=10)
print('Server file type:', r.stdout.strip())

# Check local file
import os
f = r'C:\Users\王坤\.openclaw\workspace\yan\js\app.js'
with open(f, 'rb') as fh:
    raw = fh.read()
print('Local size:', len(raw))
print('Has CRLF:', b'\\r\\n' in raw)
print('Has LF:', b'\\n' in raw)

# Convert to LF and check hash
lf_content = raw.replace(b'\\r\\n', b'\\n')
import hashlib
print('Local LF hash:', hashlib.md5(lf_content).hexdigest()[:12])
