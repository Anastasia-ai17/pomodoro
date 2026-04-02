from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ]
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='system',
        help_text="Тема оформления: светлая, тёмная или системная"
    )
    
    def __str__(self):
        return self.username