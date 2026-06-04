const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('[OK] 连接成功！');
  conn.exec('echo CONNECTED && whoami && hostname && ls /var/www/', (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => process.stdout.write(d));
    stream.on('close', () => { console.log(out); conn.end(); });
  });
});

conn.on('error', err => console.error('[ERROR]', err.message));

conn.connect({
  host: '47.102.158.179',
  port: 22,
  username: 'root',
  password: 'wangkun1982',
  readyTimeout: 15000,
  tryKeyboard: true,
  algorithms: {
    kex: ['curve25519-sha256','curve25519-sha256@libssh.org','ecdh-sha2-nistp256','diffie-hellman-group14-sha256','diffie-hellman-group-exchange-sha256'],
    cipher: ['aes256-gcm@openssh.com','chacha20-poly1305@openssh.com','aes256-ctr','aes128-ctr','aes128-gcm@openssh.com'],
    serverHostKey: ['ssh-rsa','ssh-ed25519','ecdsa-sha2-nistp256','rsa-sha2-512','rsa-sha2-256'],
    hmac: ['hmac-sha2-256-etm@openssh.com','hmac-sha2-512-etm@openssh.com','hmac-sha2-256','hmac-sha2-512','hmac-sha1'],
  }
});

// Handle keyboard-interactive
conn.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
  console.log('[KEYBOARD-INTERACTIVE] prompts:', prompts.map(p => p.prompt));
  finish([prompts[0].prompt === 'Password:' ? 'wangkun1982' : 'wangkun1982']);
});
