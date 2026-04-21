from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Avatar, UserAvatar
from .serializers import (
    AvatarSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    UserAvatarSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserThemeSerializer,
)


def build_auth_payload(user, message):
    refresh = RefreshToken.for_user(user)
    return {
        'message': message,
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        },
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        return Response(
            build_auth_payload(user, 'Пользователь успешно создан'),
            status=status.HTTP_201_CREATED,
        )

    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data['user']
        return Response(
            build_auth_payload(user, 'Вход выполнен успешно'),
            status=status.HTTP_200_OK,
        )

    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    if not request.user.is_authenticated:
        return Response({'authenticated': False, 'user': None}, status=status.HTTP_200_OK)

    return Response(
        {
            'authenticated': True,
            'user': UserSerializer(request.user).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    return Response(
        {
            'message': 'Это защищенный эндпоинт',
            'user': UserSerializer(request.user).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user

    if request.method == 'GET':
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'user': serializer.data}, status=status.HTTP_200_OK)

    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Пароль успешно обновлён'}, status=status.HTTP_200_OK)

    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    return Response({'message': 'Выход выполнен'}, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
def user_theme(request):
    user = request.user

    if request.method == 'GET':
        return Response(UserThemeSerializer(user).data, status=status.HTTP_200_OK)

    serializer = UserThemeSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def guest_theme(request):
    if request.method == 'GET':
        theme = request.COOKIES.get('theme', 'system')
        return Response({'theme': theme}, status=status.HTTP_200_OK)

    theme = request.data.get('theme', 'system')
    response = Response(
        {'theme': theme, 'message': 'Тема сохранена в cookies'},
        status=status.HTTP_200_OK,
    )
    response.set_cookie('theme', theme, max_age=60 * 60 * 24 * 365)
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def shop_avatars(request):
    avatars = Avatar.objects.all()
    serializer = AvatarSerializer(avatars, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def buy_avatar(request, avatar_id):
    user = request.user

    try:
        avatar = Avatar.objects.get(pk=avatar_id)
    except Avatar.DoesNotExist:
        return Response({'error': 'Аватар не найден'}, status=status.HTTP_404_NOT_FOUND)

    if UserAvatar.objects.filter(user=user, avatar=avatar).exists():
        return Response(
            {'error': 'Вы уже купили этот аватар'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.coins < avatar.price_coins:
        return Response(
            {
                'error': (
                    f'Недостаточно монет. Нужно: {avatar.price_coins}, '
                    f'у вас: {user.coins}'
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        user.coins -= avatar.price_coins
        user.save(update_fields=['coins'])
        UserAvatar.objects.create(user=user, avatar=avatar, is_active=False)

    return Response(
        {
            'message': f'Аватар "{avatar.name}" куплен!',
            'coins_left': user.coins,
            'avatar_id': avatar.id,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_avatar(request, avatar_id):
    user = request.user

    try:
        user_avatar = UserAvatar.objects.get(user=user, avatar_id=avatar_id)
    except UserAvatar.DoesNotExist:
        return Response(
            {'error': 'Аватар не найден в вашей коллекции'},
            status=status.HTTP_404_NOT_FOUND,
        )

    UserAvatar.objects.filter(user=user, is_active=True).update(is_active=False)
    user_avatar.is_active = True
    user_avatar.save(update_fields=['is_active'])

    return Response(
        {
            'message': 'Аватар активирован',
            'active_avatar_id': avatar_id,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_avatars(request):
    user_avatars = UserAvatar.objects.filter(user=request.user).select_related('avatar')
    serializer = UserAvatarSerializer(user_avatars, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_coins(request):
    return Response({'coins': request.user.coins}, status=status.HTTP_200_OK)
