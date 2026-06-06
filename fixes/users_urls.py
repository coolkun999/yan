from django.urls import path
from . import views
from . import follow_views

urlpatterns = [
    path('me/', views.current_user, name='current_user'),
    path('register/', views.user_register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('profile/<int:user_id>/', views.user_profile, name='profile'),
    path('profile/by-name/<str:username>/', views.user_profile_by_name, name='profile_by_name'),
    path('profile/update/', views.user_update_profile, name='update_profile'),
    path('profile/avatar/', views.user_upload_avatar, name='upload_avatar'),
    path('profile/password/', views.user_change_password, name='change_password'),
    path('list/', views.user_list, name='user_list'),
    path('csrf/', views.get_csrf_token, name='csrf'),
    path('sms/send/', views.send_sms_code, name='send_sms'),
    path('phone/check/', views.check_phone, name='check_phone'),
    path('phone/bind/', views.bind_phone, name='bind_phone'),
    path('posts/<int:user_id>/', views.user_posts, name='user_posts'),
    path('posts/by-name/<str:username>/', views.user_posts_by_name, name='user_posts_by_name'),
    path('likes/<int:user_id>/', views.user_liked_posts, name='user_liked_posts'),
    path('following/<int:user_id>/', follow_views.user_following, name='user_following'),
    path('followers/<int:user_id>/', follow_views.user_followers, name='user_followers'),
]
