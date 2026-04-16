from datetime import timedelta

from django.db.models import Sum
from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import FocusSessionSerializer


def regist(request):
    return render(request, 'regist.html')


def index(request):
    return render(request, 'index.html')


def auth(request):
    return render(request, 'auth.html')


def person(request):
    return render(request, 'person.html')


def _sum_minutes(queryset):
    return queryset.aggregate(total=Sum('duration_minutes'))['total'] or 0


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pomodoro_stats(request):
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    sessions = request.user.focus_sessions.all()

    today_minutes = _sum_minutes(sessions.filter(completed_at__gte=today_start))
    week_minutes = _sum_minutes(sessions.filter(completed_at__gte=week_start))
    month_minutes = _sum_minutes(sessions.filter(completed_at__gte=month_start))

    return Response(
        {
            'today': today_minutes,
            'week': week_minutes,
            'month': month_minutes,
            'today_minutes': today_minutes,
            'week_minutes': week_minutes,
            'month_minutes': month_minutes,
            'total_sessions': sessions.count(),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_focus_session(request):
    serializer = FocusSessionSerializer(data=request.data)
    if serializer.is_valid():
        session = serializer.save(user=request.user)
        return Response(FocusSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
