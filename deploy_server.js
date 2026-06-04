const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = '47.102.158.179';
const USER = 'root';
const PASS = 'wangkun1982';
const LOCAL_DIR = 'C:\\Users\\王坤\\.openclaw\\workspace\\yan';
const REMOTE_DIR = '/var/www/yan';

function sshExec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '', stderr = '';
      stream.on('data', d => stdout += d);
      stream.stderr.on('data', d => stderr += d);
      stream.on('close', code => resolve({ code, stdout, stderr }));
    });
  });
}

function scpPut(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const remoteDir = path.dirname(remotePath);
      sftp.mkdir(remoteDir, { recursive: true }, (mkdirErr) => {
        sftp.fastPut(localPath, remotePath, (err2) => {
          if (err2) return reject(err2);
          resolve();
        });
      });
    });
  });
}

function scpDir(conn, localDir, remoteDir) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.mkdir(remoteDir, true, (mkdirErr) => {
        const entries = fs.readdirSync(localDir, { withFileTypes: true });
        let pending = entries.length;
        if (pending === 0) return resolve();

        entries.forEach(entry => {
          const localPath = path.join(localDir, entry.name);
          const remotePath = `${remoteDir}/${entry.name}`;
          // 跳过不需要上传的文件
          if (['.git', 'node_modules', '.gitignore', 'deploy.py', 'sshpass.sh', 'sshpass.ps1', 'test-ssh.js', 'test-ssh-py.py', 'ssh_brute.js', 'ssh_debug.js', 'ssh_ki.js', 'ssh_ki2.js'].includes(entry.name)) {
            pending--;
            if (pending === 0) resolve();
            return;
          }
          if (entry.isDirectory()) {
            scpDir(conn, localPath, remotePath).then(() => {
              pending--;
              if (pending === 0) resolve();
            }).catch(reject);
          } else {
            sftp.fastPut(localPath, remotePath, (err2) => {
              if (err2) console.error(`  [FAIL] ${entry.name}:`, err2.message);
              else console.log(`  [OK] ${entry.name}`);
              pending--;
              if (pending === 0) resolve();
            });
          }
        });
      });
    });
  });
}

async function main() {
  console.log(`\n=== 部署 「言」到 ${SERVER} ===\n`);
  console.log(`本地目录: ${LOCAL_DIR}`);
  console.log(`远程目录: ${REMOTE_DIR}\n`);

  const conn = new Client();

  conn.on('ready', async () => {
    console.log('[SSH] 连接成功！\n');

    try {
      // Step 1: 检查服务器环境
      console.log('[1/6] 检查服务器环境...');
      const r1 = await sshExec(conn, 'node -v 2>&1; echo "---"; npm -v 2>&1; echo "---"; pm2 -v 2>&1; echo "---"; nginx -v 2>&1');
      console.log('  Node:', r1.stdout.split('\n')[0]);
      console.log('  NPM:', r1.stdout.split('\n')[2]);
      console.log('  PM2:', r1.stdout.split('\n')[4]);
      console.log('  Nginx:', r1.stdout.split('\n')[6]);

      // Step 2: 安装 Node.js（如果没有）
      const nodeVersion = r1.stdout.split('\n')[0].trim();
      if (!nodeVersion || nodeVersion.includes('not found')) {
        console.log('\n[2/6] 安装 Node.js...');
        await sshExec(conn, 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs');
        console.log('  Node.js 已安装');
      } else {
        console.log('\n[2/6] Node.js 已存在，跳过安装');
      }

      // Step 3: 安装 PM2（如果没有）
      const pm2Version = r1.stdout.split('\n')[4].trim();
      if (!pm2Version || pm2Version.includes('not found')) {
        console.log('\n[3/6] 安装 PM2...');
        await sshExec(conn, 'npm install -g pm2');
        console.log('  PM2 已安装');
      } else {
        console.log('\n[3/6] PM2 已存在，跳过安装');
      }

      // Step 4: 创建远程目录并上传文件
      console.log('\n[4/6] 上传项目文件...');
      await sshExec(conn, `mkdir -p ${REMOTE_DIR}/server`);
      await scpDir(conn, LOCAL_DIR, REMOTE_DIR);
      console.log('  所有文件上传完成');

      // Step 5: 安装后端依赖
      console.log('\n[5/6] 安装后端依赖...');
      const npmResult = await sshExec(conn, `cd ${REMOTE_DIR}/server && npm install --production 2>&1`);
      console.log('  ' + npmResult.stdout.split('\n').slice(-3).join('\n'));

      // Step 6: 重启后端服务
      console.log('\n[6/6] 启动/重启后端服务...');
      // 先停止旧进程
      await sshExec(conn, 'pm2 delete yan-server 2>/dev/null || true');
      // 启动新进程
      await sshExec(conn, `cd ${REMOTE_DIR}/server && pm2 start index.js --name yan-server --env production`);
      // 保存 PM2 进程列表（开机自启）
      await sshExec(conn, 'pm2 save && pm2 startup 2>&1 | tail -1');

      // 检查服务状态
      const status = await sshExec(conn, 'pm2 status yan-server');
      console.log('\n' + status.stdout);

      // 测试 API
      console.log('测试 API...');
      const testApi = await sshExec(conn, 'curl -s http://localhost:3000/api/health');
      console.log('API 响应:', testApi.stdout);

      // 配置 Nginx
      console.log('\n配置 Nginx...');
      await scpPut(conn, path.join(LOCAL_DIR, 'yan-nginx.conf'), '/etc/nginx/conf.d/yan.conf');
      const testNginx = await sshExec(conn, 'nginx -t 2>&1');
      console.log('Nginx 测试:', testNginx.stdout.trim() || testNginx.stderr.trim());
      if (!testNginx.stdout.includes('failed') && !testNginx.stderr.includes('failed')) {
        await sshExec(conn, 'nginx -s reload 2>&1');
        console.log('Nginx 已重载');
      }

      console.log('\n=== 部署完成！===');
      console.log(`前端: https://www.kunshagj.com/yan/`);
      console.log(`API:  https://www.kunshagj.com/yan/api/health`);

    } catch (err) {
      console.error('\n[ERROR]', err.message);
    }

    conn.end();
  });

  conn.on('error', err => {
    console.error('[SSH ERROR]', err.message);
    process.exit(1);
  });

  conn.connect({
    host: SERVER,
    port: 22,
    username: USER,
    password: PASS,
    readyTimeout: 15000,
    algorithms: {
      kex: ['curve25519-sha256', 'curve25519-sha256@libssh.org', 'diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1'],
      cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr', 'aes128-gcm', 'aes256-gcm'],
      serverHostKey: ['ssh-ed25519', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa'],
    }
  });
}

main();
