from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, LoginSerializer, UserThemeSerializer, AvatarSerializer, UserAvatarSerializer
from django.db import transaction
from .models import Avatar, UserAvatar



@api_view(['POST'])
#@permission_classes([AllowAny])
def register_user(request):
    """
    Регистрация нового пользователя
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(
            {
                "message": "Пользователь успешно создан",
                "user": {
                    "username": serializer.data['username'],
                    "email": serializer.data['email']
                }
            },
            status=status.HTTP_201_CREATED
        )
    
    return Response(
        {
            "errors": serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
#@permission_classes([AllowAny])
def login_user(request):
    """
    Вход пользователя через API
    """
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Вход выполнен успешно',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def protected_view(request):
    """
    Пример защищенного эндпоинта (только для авторизованных пользователей)
    """
    return Response({
        "message": "Это защищенный эндпоинт",
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email
        }
    })

@api_view(['GET', 'PUT'])
#@permission_classes([IsAuthenticated])
def user_theme(request):
    user = request.user
    
    if request.method == 'GET':
        serializer = UserThemeSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserThemeSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'POST'])
def guest_theme(request):
    if request.method == 'GET':
        theme = request.COOKIES.get('theme', 'system')
        return Response({'theme': theme})
    
    elif request.method == 'POST':
        theme = request.data.get('theme', 'system')
        response = Response({'theme': theme, 'message': 'Тема сохранена в cookies'})
        response.set_cookie('theme', theme, max_age=60*60*24*365) 
        return response

@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def shop_avatars(request):
    """Список всех аватаров в магазине"""
    avatars = Avatar.objects.all()
    serializer = AvatarSerializer(avatars, many=True)
    return Response(serializer.data)


@api_view(['POST'])
#@permission_classes([IsAuthenticated])
def buy_avatar(request, avatar_id):
    """Купить аватар"""
    user = request.user
    
    try:
        avatar = Avatar.objects.get(id=avatar_id)
    except Avatar.DoesNotExist:
        return Response({'error': 'Аватар не найден'}, status=404)
    
    if UserAvatar.objects.filter(user=user, avatar=avatar).exists():
        return Response({'error': 'Вы уже купили этот аватар'}, status=400)
    
    if user.coins < avatar.price_coins:
        return Response({'error': f'Недостаточно монет. Нужно: {avatar.price_coins}, у вас: {user.coins}'}, status=400)
    
    with transaction.atomic():
        user.coins -= avatar.price_coins
        user.save()
        UserAvatar.objects.create(user=user, avatar=avatar, is_active=False)
    
    return Response({
        'message': f'Аватар "{avatar.name}" куплен!',
        'coins_left': user.coins,
        'avatar_id': avatar.id
    })


@api_view(['POST'])
#@permission_classes([IsAuthenticated])
def activate_avatar(request, avatar_id):
    """Сделать аватар активным"""
    user = request.user
    
    try:
        user_avatar = UserAvatar.objects.get(user=user, avatar_id=avatar_id)
    except UserAvatar.DoesNotExist:
        return Response({'error': 'Аватар не найден в вашей коллекции'}, status=404)
    
    # Деактивируем все другие аватары
    UserAvatar.objects.filter(user=user, is_active=True).update(is_active=False)
    
    # Активируем выбранный
    user_avatar.is_active = True
    user_avatar.save()
    
    return Response({
        'message': f'Аватар активирован',
        'active_avatar_id': avatar_id
    })


@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def my_avatars(request):
    """Мои купленные аватары"""
    user_avatars = UserAvatar.objects.filter(user=request.user).select_related('avatar')
    serializer = UserAvatarSerializer(user_avatars, many=True)
    return Response(serializer.data)


@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def my_coins(request):
    """Мои монеты"""
    return Response({'coins': request.user.coins})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    active_avatar = UserAvatar.objects.filter(user=user, is_active=True).first()
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'coins': user.coins,
        'theme': user.theme,
        'avatar': active_avatar.avatar.image if active_avatar else None,
        'date_joined': user.date_joined,
    })
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats(request):
    return Response({
        'total_work_minutes': 0,
        'total_breaks_minutes': 0,
        'completed_tasks': 0,
        'coins_earned': 0,
        'daily': [],
        'weekly': [],
        'monthly': [],
    })