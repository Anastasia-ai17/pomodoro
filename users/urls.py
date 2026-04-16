from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('me/', views.me_view, name='me'),
    path('protected/', views.protected_view, name='protected'),
    path('profile/', views.profile_view, name='profile'),
    path('change-password/', views.change_password, name='change-password'),
    path('logout/', views.logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('theme/', views.user_theme, name='user-theme'),
    path('theme/guest/', views.guest_theme, name='guest-theme'),
]
