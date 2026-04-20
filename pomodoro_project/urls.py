from django.contrib import admin
from django.urls import path, include
from pomodoro import views as pomodoro_views
from users import views as users_views  # imported in case you need direct references
from django.views.generic import TemplateView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('regist', pomodoro_views.regist, name='regist'),
    path('', pomodoro_views.index, name='index'),
    path('auth', pomodoro_views.auth, name='auth'),
    path('person', pomodoro_views.person, name='person'),
    path('api/', include('users.urls')),
    path('', TemplateView.as_view(template_name='index.html')),
]
