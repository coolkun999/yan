const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '47.102.158.179';
const USER = 'root';
const PASS = 'wangkun1982';
const REMOTE_BASE = '/var/www/html/yan';

const files = [
  ['index.html', 'index.html'],
  ['robots.txt', 'robots.txt'],
  ['js/app.js', 'js/app.js'],
];

const conn = new Client();

conn.on('ready', () => {
  console.log('✓ SSH 连接成功！');
  uploadFiles(0);
}).on('error', (err) => {
  console.error('✗ SSH 错误:', err.message);
  process.exit(1);
}).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
  console.log('键盘交互认证...');
  finish(prompts.map(() => PASS));
}).connect({
  host: HOST,
  port: 22,
  username: USER,
  password: PASS,
  tryKeyboard: true,
  readyTimeout: 20000,
  // Try all common algorithms for compatibility
  algorithms: {
    kex: [
      'curve25519-sha256', 'curve25519-sha256@libssh.org',
      'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521',
      'diffie-hellman-group-exchange-sha256',
      'diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1',
      'diffie-hellman-group1-sha1'
    ],
    serverHostKey: [
      'ssh-rsa', 'rsa-sha2-256', 'rsa-sha2-512',
      'ecdsa-sha2-nistp256', 'ssh-ed25519'
    ],
    cipher: [
      'aes128-ctr', 'aes192-ctr', 'aes256-ctr',
      'aes128-gcm', 'aes128-gcm@openssh.com',
      'aes256-gcm', 'chacha20-poly1305@openssh.com'
    ],
    hmac: [
      'hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1'
    ]
  }
});

function uploadFiles(index) {
  if (index >= files.length) {
    console.log('\n✓ 所有文件上传完成！');
    conn.end();
    return;
  }

  const [localRel, remoteRel] = files[index];
  const localPath = path.join(__dirname, localRel);
  const remotePath = REMOTE_BASE + '/' + remoteRel;

  console.log(`上传 ${localRel} -> ${remotePath}...`);

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP 错误:', err.message);
      conn.end();
      process.exit(1);
    }

    const readStream = fs.createReadStream(localPath);
    const writeStream = sftp.createWriteStream(remotePath);

    writeStream.on('close', () => {
      console.log(`  ✓ ${localRel} 已上传`);
      uploadFiles(index + 1);
    }).on('error', (err) => {
      console.error(`  ✗ ${localRel} 失败:`, err.message);
      conn.end();
      process.exit(1);
    });

    readStream.pipe(writeStream);
  });
}
