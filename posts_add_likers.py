# -*- coding: utf-8 -*-
lines = open('/var/www/yan/posts/views.py', 'r').readlines()

new_func = '''@csrf_exempt
@require_http_methods(["GET"])
def post_likers(request, post_id):
    """获取点赞用户列表"""
    from posts.models import Like
    post = get_object_or_404(Post, id=post_id)
    likes = Like.objects.filter(post=post).select_related('user').order_by('-created_at')[:50]
    data = []
    for l in likes:
        u = l.user
        data.append({
            'id': u.id,
            'username': u.username,
            'avatar': _avatar_url(u),
            'bio': u.bio or '',
        })
    return JsonResponse({'users': data})


'''

insert_at = None
for i, line in enumerate(lines):
    if 'def comment_list_create(request, post_id):' in line:
        insert_at = i
        break

if insert_at is not None:
    lines.insert(insert_at, new_func)
    open('/var/www/yan/posts/views.py', 'w').writelines(lines)
    print('OK')
else:
    print('NOT FOUND')