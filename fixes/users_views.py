import json
import random
from datetime import timedelta
from django.utils import timezone

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.middleware.csrf import get_token

from .models import User, SMSCode


def _avatar_url(user):
    """获取用户头像URL，无头像返回None"""
    if user.avatar and hasattr(user.avatar, 'url') and user.avatar.name and user.avatar.name != 'avatars/default.png':
        return user.avatar.url
    return None


def _user_profile_json(user, request):
    """生成用户资料 JSON（复用逻辑）"""
    is_following = False
    if request.user.is_authenticated:
        is_following = user.followers.filter(id=request.user.id).exists()
    return {
        'id': user.id,
        'username': user.username,
        'phone': user.phone if request.user.is_authenticated and request.user.id == user.id else None,
        'avatar': _avatar_url(user),
        'bio': user.bio,
        'location': user.location,
        'website': user.website,
        'phone_verified': user.phone_verified,
        'followers_count': user.followers.count(),
        'following_count': user.following.count(),
        'is_following': is_following,
        'posts_count': user.posts.count(),
        'created_at': user.created_at.isoformat(),
    }


@require_http_methods(["GET"])
@csrf_exempt
def get_csrf_token(request):
    """获取CSRF token"""
    return JsonResponse({'csrfToken': get_token(request)})


@require_http_methods(["POST"])
@csrf_exempt
def send_sms_code(request):
    """发送短信验证码（本地mock，验证码直接返回）"""
    try:
        data = json.loads(request.body)
        phone = data.get('phone', '').strip()

        if not phone or len(phone) != 11 or not phone.isdigit():
            return JsonResponse({'error': '请输入正确的11位手机号'}, status=400)

        # 限制：同一手机号60秒内只能发一次
        one_min_ago = timezone.now() - timedelta(seconds=60)
        if SMSCode.objects.filter(phone=phone, created_at__gte=one_min_ago).exists():
            return JsonResponse({'error': '发送太频繁，请60秒后再试'}, status=429)

        # 生成6位验证码
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        SMSCode.objects.create(phone=phone, code=code)

        # 本地mock：直接返回验证码（生产环境调短信API）
        return JsonResponse({
            'message': '验证码已发送',
            'code': code,  # mock阶段直接返回，上线删掉
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def user_register(request):
    """用户注册（支持手机号+验证码 或 用户名+密码）"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        sms_code = data.get('sms_code', '').strip()

        if not username or not password:
            return JsonResponse({'error': '用户名和密码不能为空'}, status=400)

        if len(username) < 4 or len(username) > 20:
            return JsonResponse({'error': '用户名长度4-20位'}, status=400)

        if len(password) < 6:
            return JsonResponse({'error': '密码至少6位'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': '用户名已存在'}, status=400)

        # 如果提供了手机号，验证验证码
        phone_verified = False
        if phone:
            if len(phone) != 11 or not phone.isdigit():
                return JsonResponse({'error': '请输入正确的11位手机号'}, status=400)

            if User.objects.filter(phone=phone).exists():
                return JsonResponse({'error': '该手机号已注册'}, status=400)

            if not sms_code:
                return JsonResponse({'error': '请输入验证码'}, status=400)

            # 验证验证码
            five_min_ago = timezone.now() - timedelta(minutes=5)
            code_obj = SMSCode.objects.filter(
                phone=phone,
                code=sms_code,
                is_used=False,
                created_at__gte=five_min_ago
            ).first()

            if not code_obj:
                return JsonResponse({'error': '验证码错误或已过期'}, status=400)

            code_obj.is_used = True
            code_obj.save()
            phone_verified = True

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            phone=phone if phone else None,
            phone_verified=phone_verified,
        )
        login(request, user)
        return JsonResponse({
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'phone_verified': user.phone_verified,
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def user_login(request):
    """用户登录（支持用户名 或 手机号）"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '')
        password = data.get('password', '')
        phone = data.get('phone', '')

        # 手机号登录
        if phone and not username:
            try:
                user_obj = User.objects.get(phone=phone)
                username = user_obj.username
            except User.DoesNotExist:
                return JsonResponse({'error': '该手机号未注册'}, status=401)

        # 邮箱登录：找到对应用户名
        if "@" in username:
            try:
                user_obj = User.objects.get(email=username)
                username = user_obj.username
            except User.DoesNotExist:
                return JsonResponse({"error": "该邮箱未注册"}, status=401)

        user = authenticate(username=username, password=password)
        if user is None:
            return JsonResponse({"error": "用户名或密码错误"}, status=401)

        login(request, user)
        return JsonResponse({
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'phone_verified': user.phone_verified,
            'avatar': _avatar_url(user),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
@login_required
@csrf_exempt
def user_logout(request):
    """用户登出"""
    logout(request)
    return JsonResponse({'message': '已退出登录'})


@require_http_methods(["GET"])
@csrf_exempt
def user_profile(request, user_id):
    """获取用户资料（通过 user_id）"""
    try:
        user = User.objects.get(id=user_id)
        return JsonResponse(_user_profile_json(user, request))
    except User.DoesNotExist:
        return JsonResponse({'error': '用户不存在'}, status=404)


@require_http_methods(["GET"])
@csrf_exempt
def user_profile_by_name(request, username):
    """获取用户资料（通过用户名）"""
    try:
        user = User.objects.get(username=username)
        return JsonResponse(_user_profile_json(user, request))
    except User.DoesNotExist:
        return JsonResponse({'error': '用户不存在'}, status=404)


@require_http_methods(["POST"])
@login_required
@csrf_exempt
def user_update_profile(request):
    """更新用户资料"""
    try:
        user = request.user
        data = json.loads(request.body)

        if 'bio' in data:
            user.bio = data['bio'][:280]
        if 'location' in data:
            user.location = data['location'][:100]
        if 'website' in data:
            user.website = data['website']

        user.save()
        return JsonResponse({
            'id': user.id,
            'username': user.username,
            'bio': user.bio,
            'location': user.location,
            'website': user.website,
            'avatar': _avatar_url(user),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
@login_required
@csrf_exempt
def user_upload_avatar(request):
    """上传头像"""
    try:
        avatar = request.FILES.get('avatar')
        if not avatar:
            return JsonResponse({'error': '请选择图片'}, status=400)

        # 检查文件大小（5MB）
        if avatar.size > 5 * 1024 * 1024:
            return JsonResponse({'error': '图片不能超过5MB'}, status=400)

        # 检查文件类型
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if avatar.content_type not in allowed_types:
            return JsonResponse({'error': '仅支持JPG/PNG/GIF/WebP格式'}, status=400)

        user = request.user
        user.avatar = avatar
        user.save()
        return JsonResponse({'avatar': user.avatar.url})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
@csrf_exempt
def user_list(request):
    """用户列表"""
    users = User.objects.all()[:50]
    data = [{
        'id': u.id,
        'username': u.username,
        'avatar': _avatar_url(u),
    } for u in users]
    return JsonResponse({'users': data})


@require_http_methods(["POST"])
@csrf_exempt
def check_phone(request):
    """检查手机号是否已注册"""
    try:
        data = json.loads(request.body)
        phone = data.get('phone', '').strip()
        exists = User.objects.filter(phone=phone).exists()
        return JsonResponse({'exists': exists})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
@login_required
@csrf_exempt
def bind_phone(request):
    """绑定手机号"""
    try:
        data = json.loads(request.body)
        phone = data.get('phone', '').strip()
        sms_code = data.get('sms_code', '').strip()

        if not phone or len(phone) != 11:
            return JsonResponse({'error': '请输入正确的11位手机号'}, status=400)

        if User.objects.filter(phone=phone).exclude(id=request.user.id).exists():
            return JsonResponse({'error': '该手机号已被其他账号绑定'}, status=400)

        if not sms_code:
            return JsonResponse({'error': '请输入验证码'}, status=400)

        five_min_ago = timezone.now() - timedelta(minutes=5)
        code_obj = SMSCode.objects.filter(
            phone=phone,
            code=sms_code,
            is_used=False,
            created_at__gte=five_min_ago
        ).first()

        if not code_obj:
            return JsonResponse({'error': '验证码错误或已过期'}, status=400)

        code_obj.is_used = True
        code_obj.save()

        request.user.phone = phone
        request.user.phone_verified = True
        request.user.save()

        return JsonResponse({'message': '手机号绑定成功', 'phone': phone})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def user_change_password(request):
    """修改密码"""
    try:
        data = json.loads(request.body)
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')

        if not old_password or not new_password:
            return JsonResponse({'error': '请输入旧密码和新密码'}, status=400)

        if len(new_password) < 6:
            return JsonResponse({'error': '新密码至少6位'}, status=400)

        if not request.user.check_password(old_password):
            return JsonResponse({'error': '旧密码错误'}, status=400)

        request.user.set_password(new_password)
        request.user.save()
        # 重新登录保持session
        login(request, request.user)
        return JsonResponse({'message': '密码修改成功'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def _user_posts_json(user):
    """生成用户帖子列表 JSON（复用逻辑）"""
    from posts.models import Post
    posts = Post.objects.filter(author=user)[:50]
    data = []
    for p in posts:
        item = {
            'id': p.id,
            'author_id': p.author.id,
            'author_name': p.author.username,
            'author_avatar': _avatar_url(p.author),
            'content': p.content,
            'post_type': p.post_type,
            'likes_count': p.likes_count,
            'comments_count': p.comments_count,
            'created_at': p.created_at.isoformat(),
        }
        if p.image:
            item['image'] = p.image.url
        if p.video:
            item['video'] = p.video.url
        data.append(item)
    return data


@csrf_exempt
@require_http_methods(["GET"])
def user_posts(request, user_id):
    """获取指定用户的帖子列表"""
    try:
        user = User.objects.get(id=user_id)
        return JsonResponse({'posts': _user_posts_json(user)})
    except User.DoesNotExist:
        return JsonResponse({'error': '用户不存在'}, status=404)


@csrf_exempt
@require_http_methods(["GET"])
def user_posts_by_name(request, username):
    """获取指定用户的帖子列表（通过用户名）"""
    try:
        user = User.objects.get(username=username)
        return JsonResponse({'posts': _user_posts_json(user)})
    except User.DoesNotExist:
        return JsonResponse({'error': '用户不存在'}, status=404)


@csrf_exempt
@require_http_methods(["GET"])
def user_liked_posts(request, user_id):
    """获取指定用户喜欢的帖子"""
    try:
        user = User.objects.get(id=user_id)
        from posts.models import Like
        likes = Like.objects.filter(user=user).select_related('post', 'post__author')[:50]
        data = []
        for like in likes:
            p = like.post
            item = {
                'id': p.id,
                'author_id': p.author.id,
                'author_name': p.author.username,
                'author_avatar': _avatar_url(p.author),
                'content': p.content,
                'post_type': p.post_type,
                'likes_count': p.likes_count,
                'comments_count': p.comments_count,
                'created_at': p.created_at.isoformat(),
            }
            if p.image:
                item['image'] = p.image.url
            if p.video:
                item['video'] = p.video.url
            data.append(item)
        return JsonResponse({'posts': data})

    except User.DoesNotExist:
        return JsonResponse({"error": "用户不存在"}, status=404)


@require_http_methods(["GET"])
@csrf_exempt
def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "未登录"}, status=401)
    user = request.user
    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "avatar": _avatar_url(user),
        "bio": user.bio,
        "location": user.location,
        "website": user.website,
        "followers_count": user.followers.count(),
        "following_count": user.following.count(),
        "posts_count": user.posts.count(),
    })
