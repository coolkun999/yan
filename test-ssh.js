const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected successfully!');
  conn.exec('ls /var/www/html/yan/', (err, stream) => {
    if (err) { console.error('Exec error:', err.message); conn.end(); return; }
    stream.on('data', (data) => console.log('STDOUT:', data.toString()));
    stream.stderr.on('data', (data) => console.log('STDERR:', data.toString()));
    stream.on('close', () => { console.log('Done'); conn.end(); });
  });
}).on('error', (err) => {
  console.error('SSH error:', err.message);
}).on('handshake', () => {
  console.log('Handshake completed');
}).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
  console.log('Keyboard-interactive:', name, instructions);
  finish(['wangkun1982']);
}).connect({
  host: '47.102.158.179',
  port: 22,
  username: 'root',
  password: 'wangkun1982',
  tryKeyboard: true,
  readyTimeout: 15000,
  debug: (msg) => {
    if (msg.includes('Auth') || msg.includes('auth') || msg.includes('method')) {
      console.log('[DEBUG]', msg);
    }
  }
});
