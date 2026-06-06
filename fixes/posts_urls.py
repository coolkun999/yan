from django.urls import path
from . import views

urlpatterns = [
    path('', views.post_list_create, name='post_list_create'),
    path('search/', views.post_search, name='post_search'),
    path('user-search/', views.user_search, name='user_search'),
    path('<int:post_id>/', views.post_detail, name='post_detail'),
    path('<int:post_id>/like/', views.post_like, name='post_like'),
    path('<int:post_id>/comments/', views.comment_list_create, name='comment_list_create'),
    path('<int:post_id>/delete/', views.post_delete, name='post_delete'),
    path('comments/<int:comment_id>/delete/', views.comment_delete, name='comment_delete'),
    path('<int:user_id>/follow/', views.post_follow, name='post_follow'),
    path('by-name/<str:username>/follow/', views.follow_by_name, name='follow_by_name'),
]
