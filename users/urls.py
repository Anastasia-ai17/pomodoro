from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('protected/', views.protected_view, name='protected'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('theme/', views.user_theme, name='user-theme'),
    path('theme/guest/', views.guest_theme, name='guest-theme'),
    path('shop/avatars/', views.shop_avatars, name='shop-avatars'),
    path('shop/avatars/<int:avatar_id>/buy/', views.buy_avatar, name='buy-avatar'),
    path('shop/avatars/<int:avatar_id>/activate/', views.activate_avatar, name='activate-avatar'),
    path('shop/my-avatars/', views.my_avatars, name='my-avatars'),
    path('shop/coins/', views.my_coins, name='my-coins'),
]