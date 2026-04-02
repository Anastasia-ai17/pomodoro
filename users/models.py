from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    coins = models.IntegerField(default=0)
    avatar = models.CharField(max_length=100, default='fa-dog')
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
    ]
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='light',
        help_text="Тема оформления: светлая, тёмная"
    )
    
    def __str__(self):
        return self.username