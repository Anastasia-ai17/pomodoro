from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    coins = models.IntegerField(default=0)
    avatar = models.CharField(max_length=100, default='fa-dog')
    birthdate = models.DateField(blank=True, null=True)
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
    ]
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='light',
        help_text='Тема оформления: светлая, тёмная',
    )

    def __str__(self):
        return self.username


class Avatar(models.Model):
    name = models.CharField(max_length=100)
    image = models.CharField(max_length=500)
    price_coins = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.name} ({self.price_coins} монет)'


class UserAvatar(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='avatars')
    avatar = models.ForeignKey(Avatar, on_delete=models.CASCADE)
    purchased_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'avatar')

    def __str__(self):
        return f'{self.user.username} - {self.avatar.name}'
