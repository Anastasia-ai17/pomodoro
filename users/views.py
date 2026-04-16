from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
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
