from django.contrib import admin
from django.urls import path, include
from pomodoro import views as pomodoro_views
from users import views as users_views  # imported in case you need direct references

urlpatterns = [
    path('admin/', admin.site.urls),
    path('regist', pomodoro_views.regist, name='regist'),
    path('', pomodoro_views.index, name='index'),
    path('auth', pomodoro_views.auth, name='auth'),
    path('person', pomodoro_views.person, name='person'),
    path('api/', include('users.urls')),
]
