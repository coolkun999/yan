"""
言 (Yan) API 测试工具
用法: python test.py [--url URL]
"""
import subprocess, json, sys, argparse

def api(method, path, data=None, token=None, base='http://localhost:3000/api'):
    """调用 API"""
    cmd = ['curl', '-s', '-X', method, base + path, '-H', 'Content-Type: application/json']
    if token:
        cmd += ['-H', f'Authorization: Bearer {token}']
    if data:
        cmd += ['-d', json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True)
    try:
        return json.loads(r.stdout)
    except:
        return {'error': r.stdout.decode(errors='replace')}

def main():
    parser = argparse.ArgumentParser(description="言 API 测试工具")
    parser.add_argument("--url", default="http://localhost:3000/api", help="API 基础 URL")
    args = parser.parse_args()
    
    BASE = args.url
    
    print(f"\n{'='*50}")
    print(f"  言 (Yan) API 测试")
    print(f"  目标: {BASE}")
    print(f"{'='*50}\n")
    
    tests_passed = 0
    tests_failed = 0
    
    def test(name, condition):
        nonlocal tests_passed, tests_failed
        if condition:
            print(f"  [OK] {name}")
            tests_passed += 1
        else:
            print(f"  [FAIL] {name}")
            tests_failed += 1
    
    # 1. Health check
    print("[1] 健康检查...")
    h = api('GET', '/health', base=BASE)
    test("API 可访问", h.get('status') == 'ok')
    test("版本号存在", 'version' in h)
    test("统计数据存在", 'stats' in h)
    
    # 2. Register
    print("\n[2] 注册...")
    import time
    test_email = f'test_{int(time.time())}@test.com'
    reg = api('POST', '/auth/register', {'name': 'TestAPI', 'email': test_email, 'password': '123456'}, base=BASE)
    test("注册成功", 'token' in reg)
    if 'token' in reg:
        token = reg['token']
        test("返回用户信息", 'user' in reg)
        test("用户有 ID", reg['user'].get('id') is not None)
    
    # 3. Login
    print("\n[3] 登录...")
    login = api('POST', '/auth/login', {'email': 'apitest@test.com', 'password': '123456'}, base=BASE)
    test("登录成功", 'token' in login)
    if 'token' in login:
        token = login['token']
    
    # 4. Get current user
    print("\n[4] 获取当前用户...")
    me = api('GET', '/auth/me', token=token, base=BASE)
    test("获取用户成功", me.get('name') == 'TestAPI')
    test("用户有帖子数", 'posts' in me)
    test("用户有粉丝数", 'followers' in me)
    
    # 5. Create post
    print("\n[5] 发帖...")
    post = api('POST', '/posts', {'content': 'API test post'}, token=token, base=BASE)
    test("发帖成功", post.get('id') is not None)
    test("帖子有内容", post.get('content') is not None)
    post_id = post.get('id')
    
    # 6. Get posts
    print("\n[6] 获取帖子列表...")
    posts = api('GET', '/posts', base=BASE)
    test("获取帖子成功", 'posts' in posts)
    test("有帖子数据", len(posts.get('posts', [])) > 0)
    test("有总数", 'total' in posts)
    
    # 7. Like post
    print("\n[7] 点赞...")
    like = api('POST', f'/posts/{post_id}/like', token=token, base=BASE)
    test("点赞成功", 'liked' in like)
    test("返回点赞数", 'likes_count' in like)
    
    # 8. Reply
    print("\n[8] 回复...")
    reply = api('POST', f'/posts/{post_id}/reply', {'content': 'Test reply'}, token=token, base=BASE)
    test("回复成功", reply.get('id') is not None)
    
    # 9. User profile
    print("\n[9] 用户主页...")
    profile = api('GET', '/users/@wangkun', base=BASE)
    test("获取用户主页", profile.get('name') is not None)
    test("用户有帖子数", 'posts' in profile)
    
    # 10. Follow
    print("\n[10] 关注...")
    follow = api('POST', '/users/@linxiaoyu/follow', token=token, base=BASE)
    test("关注成功", 'following' in follow)
    
    # 11. Search
    print("\n[11] 搜索...")
    search = api('GET', '/users/search/wang', base=BASE)
    test("搜索成功", isinstance(search, list))
    test("有搜索结果", len(search) > 0)
    
    # Summary
    print(f"\n{'='*50}")
    print(f"  测试结果: {tests_passed} 通过, {tests_failed} 失败")
    print(f"{'='*50}\n")
    
    return 0 if tests_failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
