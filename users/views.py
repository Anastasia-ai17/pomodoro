from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import UserRegistrationSerializer

@api_view(['POST'])
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