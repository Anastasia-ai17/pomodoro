from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    coins = models.PositiveIntegerField(default=0)
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ]
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='system'
    )
    
    def __str__(self):
        return self.username


class Avatar(models.Model):
    """Аватар для магазина"""
    name = models.CharField(max_length=100)
    image = models.CharField(max_length=500)  # пока строка, потом можно ImageField
    price_coins = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.name} ({self.price_coins} монет)"


class UserAvatar(models.Model):
    """Аватары, купленные пользователем"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='avatars')
    avatar = models.ForeignKey(Avatar, on_delete=models.CASCADE)
    purchased_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'avatar')  # нельзя купить один аватар дважды
    
    def __str__(self):
        return f"{self.user.username} - {self.avatar.name}"