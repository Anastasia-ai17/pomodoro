from django.urls import path

from . import views


urlpatterns = [
    path('stats/', views.pomodoro_stats, name='pomodoro-stats'),
    path('sessions/', views.create_focus_session, name='pomodoro-sessions'),
]
