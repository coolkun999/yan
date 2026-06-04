"""
言 (Yan) 部署脚本
用法: python deploy.py [--skip-deps] [--skip-db]
"""
import subprocess, os, sys, argparse

SERVER = "47.102.158.179"
USER = "root"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))
REMOTE_DIR = "/var/www/yan"

def log(msg, level="info"):
    colors = {"info": "\033[36m", "success": "\033[32m", "warn": "\033[33m", "error": "\033[31m"}
    reset = "\033[0m"
    print(f"{colors.get(level, '')}{msg}{reset}")

def run(cmd, check=True):
    """执行命令"""
    r = subprocess.run(cmd, shell=True, capture_output=True)
    return r

def upload_file(src, dst):
    """上传文件"""
    if not os.path.exists(src):
        log(f"  文件不存在: {src}", "warn")
        return False
    r = run(f'scp -o StrictHostKeyChecking=no "{src}" {USER}@{SERVER}:{dst}')
    return r.returncode == 0

def ssh_cmd(cmd):
    """执行远程命令"""
    return run(f'ssh -o StrictHostKeyChecking=no {USER}@{SERVER} "{cmd}"')

def main():
    parser = argparse.ArgumentParser(description="言 (Yan) 部署工具")
    parser.add_argument("--skip-deps", action="store_true", help="跳过安装依赖")
    parser.add_argument("--skip-db", action="store_true", help="跳过重置数据库")
    args = parser.parse_args()

    log(f"\n{'='*50}")
    log(f"  言 (Yan) 部署工具 v1.0")
    log(f"  服务器: {SERVER}")
    log(f"{'='*50}\n")

    # 1. 上传前端文件
    log("[1/5] 上传前端文件...")
    frontend_files = [
        ("index.html", "index.html"),
        ("css/style.css", "css/style.css"),
        ("js/api.js", "js/api.js"),
        ("js/auth.js", "js/auth.js"),
        ("js/app.js", "js/app.js"),
        ("favicon.svg", "favicon.svg"),
        ("og-image.png", "og-image.png"),
        ("yan-logo-1024.png", "yan-logo-1024.png"),
    ]
    for local, remote in frontend_files:
        src = os.path.join(LOCAL_DIR, local)
        dst = f"{REMOTE_DIR}/{remote}"
        if upload_file(src, dst):
            log(f"  ✓ {local}")
        else:
            log(f"  ✗ {local}", "warn")

    # 2. 上传后端文件
    log("\n[2/5] 上传后端文件...")
    server_files = [
        ("server/package.json", "server/package.json"),
        ("server/db.js", "server/db.js"),
        ("server/index.js", "server/index.js"),
        ("server/routes/auth.js", "server/routes/auth.js"),
        ("server/routes/posts.js", "server/routes/posts.js"),
        ("server/routes/users.js", "server/routes/users.js"),
    ]
    for local, remote in server_files:
        src = os.path.join(LOCAL_DIR, local)
        dst = f"{REMOTE_DIR}/{remote}"
        if upload_file(src, dst):
            log(f"  ✓ {local}")
        else:
            log(f"  ✗ {local}", "warn")

    # 3. 安装依赖
    if not args.skip_deps:
        log("\n[3/5] 安装后端依赖...")
        r = ssh_cmd(f"cd {REMOTE_DIR}/server && npm install --production 2>&1 | tail -3")
        log(f"  {r.stdout.decode().strip()}")
    else:
        log("\n[3/5] 跳过依赖安装", "warn")

    # 4. 重启服务
    log("\n[4/5] 重启后端服务...")
    if not args.skip_db:
        ssh_cmd(f"cd {REMOTE_DIR}/server && rm -f yan.db*")
        log("  数据库已重置")
    r = ssh_cmd("pm2 restart yan-server 2>&1 | tail -5")
    log(f"  {r.stdout.decode().strip()}")

    # 5. 验证
    log("\n[5/5] 验证部署...")
    import time
    time.sleep(2)
    r = ssh_cmd("curl -s http://localhost:3000/api/health")
    if r.returncode == 0:
        response = r.stdout.decode().strip()
        log(f"  API 响应: {response}")
        if '"status":"ok"' in response:
            log("  ✓ API 正常", "success")
        else:
            log("  ✗ API 异常", "error")
    else:
        log("  ✗ API 无法访问", "error")

    log(f"\n{'='*50}")
    log(f"  部署完成！", "success")
    log(f"  前端: https://www.kunshagj.com/yan/")
    log(f"  API:  https://www.kunshagj.com/yan/api/health")
    log(f"{'='*50}\n")

if __name__ == "__main__":
    main()
