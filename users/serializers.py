from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import User, UserAvatar, Avatar


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Пользователь с таким именем уже существует")
        return value
    
    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField(required=False, allow_blank=True)  # новое поле
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        login = data.get('login')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not password:
            raise serializers.ValidationError("Пароль обязателен")

        user = None
        
        # Если передан login
        if login:
            # Пробуем как username
            user = authenticate(username=login, password=password)
            # Если не нашлось — пробуем как email
            if not user:
                try:
                    user_obj = User.objects.get(email=login)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
        
        # Если нет login, но есть username
        if not user and username:
            user = authenticate(username=username, password=password)
        
        # Если нет login и username, но есть email
        if not user and email:
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        if user and user.is_active:
            data['user'] = user
            return data
        
        raise serializers.ValidationError("Неверные учётные данные")

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class UserThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('theme',)
class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = ('id', 'name', 'image', 'price_coins', 'is_default')


class UserAvatarSerializer(serializers.ModelSerializer):
    avatar = AvatarSerializer(read_only=True)
    avatar_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = UserAvatar
        fields = ('id', 'avatar', 'avatar_id', 'purchased_at', 'is_active')
        read_only_fields = ('id', 'purchased_at')