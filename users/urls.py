from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('logout/', views.logout_view, name='logout'),  # добавьте эту строку
]