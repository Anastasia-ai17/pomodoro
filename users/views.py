from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, LoginSerializer, UserThemeSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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