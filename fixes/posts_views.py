import json
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Post, Like, Comment
from users.models import User
from users.views import _avatar_url


@csrf_exempt
@require_http_methods(["GET", "POST"])
def post_list_create(request):
    """GET: 获取动态列表 / POST: 创建动态（支持图片/视频上传）"""
    if request.method == "GET":
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        offset = (page - 1) * page_size
        total = Post.objects.count()
        posts = Post.objects.all()[offset:offset + page_size]
        has_more = offset + page_size < total
        data = []
        for p in posts:
            is_liked = False
            if request.user.is_authenticated:
                is_liked = Like.objects.filter(user=request.user, post=p).exists()
            item = {
                'id': p.id,
                'author_id': p.author.id,
                'author_name': p.author.username,
                'author_avatar': _avatar_url(p.author),
                'content': p.content,
                'post_type': p.post_type,
                'likes_count': p.likes_count,
                'comments_count': p.comments_count,
                'reposts_count': p.reposts_count,
                'is_liked': is_liked,
                'created_at': p.created_at.isoformat(),
            }
            if p.image:
                item['image'] = p.image.url
            if p.video:
                item['video'] = p.video.url
            data.append(item)
        return JsonResponse({'posts': data, 'total': total, 'has_more': has_more})

    if not request.user.is_authenticated:
        return JsonResponse({'error': '请先登录'}, status=401)

    # 支持两种提交方式：JSON 或 FormData（文件上传）
    if request.content_type and 'multipart' in request.content_type:
        content = request.POST.get('content', '').strip()
        image = request.FILES.get('image')
        video = request.FILES.get('video')
    else:
        data = json.loads(request.body)
        content = data.get('content', '').strip()
        image = None
        video = None

    if not content and not image and not video:
        return JsonResponse({'error': '内容不能为空'}, status=400)

    if len(content) > 500:
        return JsonResponse({'error': '内容不能超过500字'}, status=400)

    # 判断类型
    post_type = 'text'
    if video:
        post_type = 'video'
        if video.size > 50 * 1024 * 1024:
            return JsonResponse({'error': '视频不能超过50MB'}, status=400)
        allowed_video = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
        if video.content_type not in allowed_video:
            return JsonResponse({'error': '仅支持MP4/MOV/AVI/WebM格式视频'}, status=400)
    elif image:
        post_type = 'image'
        if image.size > 5 * 1024 * 1024:
            return JsonResponse({'error': '图片不能超过5MB'}, status=400)
        allowed_img = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_img:
            return JsonResponse({'error': '仅支持JPG/PNG/GIF/WebP格式图片'}, status=400)

    post = Post.objects.create(
        author=request.user,
        content=content,
        post_type=post_type,
        image=image if image else None,
        video=video if video else None,
    )

    result = {
        'id': post.id,
        'content': post.content,
        'post_type': post.post_type,
        'author_id': post.author.id,
        'author_name': post.author.username,
        'author_avatar': _avatar_url(post.author),
        'likes_count': 0,
        'comments_count': 0,
        'reposts_count': 0,
        'is_liked': False,
        'created_at': post.created_at.isoformat(),
    }
    if post.image:
        result['image'] = post.image.url
    if post.video:
        result['video'] = post.video.url
    return JsonResponse(result, status=201)


@csrf_exempt
@require_http_methods(["GET"])
def post_detail(request, post_id):
    """获取单条动态详情（含评论）"""
    post = get_object_or_404(Post, id=post_id)
    is_liked = False
    if request.user.is_authenticated:
        is_liked = Like.objects.filter(user=request.user, post=post).exists()

    # 获取评论
    comments = Comment.objects.filter(post=post).select_related('user')[:50]
    comments_data = [{
        'id': c.id,
        'author_id': c.user.id,
        'author_name': c.user.username,
        'author_avatar': _avatar_url(c.user),
        'content': c.content,
        'created_at': c.created_at.isoformat(),
    } for c in comments]

    result = {
        'id': post.id,
        'author_id': post.author.id,
        'author_name': post.author.username,
        'author_avatar': _avatar_url(post.author),
        'content': post.content,
        'post_type': post.post_type,
        'likes_count': post.likes_count,
        'comments_count': post.comments_count,
        'reposts_count': post.reposts_count,
        'is_liked': is_liked,
        'created_at': post.created_at.isoformat(),
        'comments': comments_data,
    }
    if post.image:
        result['image'] = post.image.url
    if post.video:
        result['video'] = post.video.url
    return JsonResponse(result)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def post_like(request, post_id):
    """点赞/取消点赞"""
    post = get_object_or_404(Post, id=post_id)
    like, created = Like.objects.get_or_create(user=request.user, post=post)

    if not created:
        like.delete()
        post.likes_count = max(0, post.likes_count - 1)
        post.save()
        return JsonResponse({'liked': False, 'likes_count': post.likes_count})

    post.likes_count += 1
    post.save()
    return JsonResponse({'liked': True, 'likes_count': post.likes_count})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def comment_list_create(request, post_id):
    """GET: 获取评论列表 / POST: 添加评论"""
    post = get_object_or_404(Post, id=post_id)

    if request.method == "GET":
        comments = Comment.objects.filter(post=post).select_related('user')[:50]
        data = [{
            'id': c.id,
            'author_id': c.user.id,
            'author_name': c.user.username,
            'author_avatar': _avatar_url(c.user),
            'content': c.content,
            'created_at': c.created_at.isoformat(),
        } for c in comments]
        return JsonResponse({'comments': data})

    if not request.user.is_authenticated:
        return JsonResponse({'error': '请先登录'}, status=401)

    data = json.loads(request.body)
    content = data.get('content', '').strip()

    if not content:
        return JsonResponse({'error': '评论不能为空'}, status=400)

    comment = Comment.objects.create(user=request.user, post=post, content=content)
    post.comments_count += 1
    post.save()

    return JsonResponse({
        'id': comment.id,
        'author_id': comment.user.id,
        'author_name': comment.user.username,
        'author_avatar': _avatar_url(comment.user),
        'content': comment.content,
        'created_at': comment.created_at.isoformat(),
    }, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
@login_required
def comment_delete(request, comment_id):
    """删除评论"""
    comment = get_object_or_404(Comment, id=comment_id)
    if comment.user != request.user:
        return JsonResponse({'error': '只能删除自己的评论'}, status=403)
    post = comment.post
    comment.delete()
    post.comments_count = max(0, post.comments_count - 1)
    post.save()
    return JsonResponse({'message': '评论已删除'})


@csrf_exempt
@require_http_methods(["DELETE"])
@login_required
def post_delete(request, post_id):
    """删除帖子"""
    post = get_object_or_404(Post, id=post_id)
    if post.author != request.user:
        return JsonResponse({'error': '只能删除自己的帖子'}, status=403)
    post.delete()
    return JsonResponse({'message': '已删除'})


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def post_follow(request, user_id):
    """关注/取关用户（通过 user_id）"""
    target_user = get_object_or_404(User, id=user_id)

    if target_user == request.user:
        return JsonResponse({'error': '不能关注自己'}, status=400)

    if request.user.following.filter(id=user_id).exists():
        request.user.following.remove(target_user)
        return JsonResponse({'following': False})

    request.user.following.add(target_user)
    return JsonResponse({'following': True})


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def follow_by_name(request, username):
    """关注/取关用户（通过用户名）"""
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'error': '用户不存在'}, status=404)

    if target_user == request.user:
        return JsonResponse({'error': '不能关注自己'}, status=400)

    if request.user.following.filter(id=target_user.id).exists():
        request.user.following.remove(target_user)
        return JsonResponse({'following': False})

    request.user.following.add(target_user)
    return JsonResponse({'following': True})


@csrf_exempt
@require_http_methods(["GET"])
def post_search(request):
    """搜索帖子"""
    q = request.GET.get('q', '').strip()
    if not q:
        return JsonResponse({'posts': []})
    posts = Post.objects.filter(content__icontains=q)[:20]
    data = []
    for p in posts:
        is_liked = False
        if request.user.is_authenticated:
            is_liked = Like.objects.filter(user=request.user, post=p).exists()
        item = {
            'id': p.id,
            'author_id': p.author.id,
            'author_name': p.author.username,
            'author_avatar': _avatar_url(p.author),
            'content': p.content,
            'post_type': p.post_type,
            'likes_count': p.likes_count,
            'comments_count': p.comments_count,
            'reposts_count': p.reposts_count,
            'is_liked': is_liked,
            'created_at': p.created_at.isoformat(),
        }
        if p.image:
            item['image'] = p.image.url
        if p.video:
            item['video'] = p.video.url
        data.append(item)
    return JsonResponse({'posts': data})


@csrf_exempt
@require_http_methods(["GET"])
def user_search(request):
    """搜索用户（含统计信息）"""
    q = request.GET.get('q', '').strip()
    if not q:
        return JsonResponse({'users': []})
    users = User.objects.filter(username__icontains=q)[:20]
    data = [{
        'id': u.id,
        'username': u.username,
        'avatar': _avatar_url(u),
        'bio': u.bio,
        'followers_count': u.followers.count(),
        'following_count': u.following.count(),
        'posts_count': u.posts.count(),
    } for u in users]
    return JsonResponse({'users': data})
