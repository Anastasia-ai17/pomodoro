from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('protected/', views.protected_view, name='protected'),  # 👈 новая строка
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]