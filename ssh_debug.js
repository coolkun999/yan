const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('CONNECTED OK');
  conn.exec('echo OK && whoami && hostname', (err, stream) => {
    if (err) console.error('exec err:', err);
    stream.on('data', d => console.log('OUT:', d.toString()));
    stream.stderr.on('data', d => console.log('ERR:', d.toString()));
    stream.on('close', () => conn.end());
  });
});

conn.on('error', err => console.error('CONN ERROR:', err.message));

// Try with verbose handshake
conn.on('handshake', () => console.log('handshake complete'));

conn.connect({
  host: '47.102.158.179',
  port: 22,
  username: 'root',
  password: 'wangkun1982',
  readyTimeout: 15000,
  debug: (msg) => console.log('[DEBUG]', msg),
  algorithms: {
    kex: [
      'curve25519-sha256', 'curve25519-sha256@libssh.org',
      'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521',
      'diffie-hellman-group-exchange-sha256',
      'diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1',
      'diffie-hellman-group1-sha1'
    ],
    cipher: ['aes128-ctr','aes192-ctr','aes256-ctr','aes128-gcm','aes256-gcm'],
    serverHostKey: ['ssh-rsa', 'ssh-ed25519', 'ecdsa-sha2-nistp256'],
    hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1'],
  }
});
