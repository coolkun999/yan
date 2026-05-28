import subprocess, sys, os, time

proc = subprocess.Popen(
    ['C:/Windows/System32/OpenSSH/ssh.exe', '-o', 'StrictHostKeyChecking=no',
     '-o', 'PreferredAuthentications=password',
     '-o', 'PubkeyAuthentication=no',
     'root@47.102.158.179', 'echo hello'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    bufsize=0
)

time.sleep(2)

try:
    proc.stdin.write(b'wangkun1982\n')
    proc.stdin.flush()
except:
    pass

try:
    stdout, stderr = proc.communicate(timeout=10)
    print('STDOUT:', stdout.decode('utf-8', errors='replace'))
    print('STDERR:', stderr.decode('utf-8', errors='replace'))
    print('RC:', proc.returncode)
except subprocess.TimeoutExpired:
    proc.kill()
    print('TIMEOUT')
