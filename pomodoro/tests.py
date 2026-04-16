from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import FocusSession


User = get_user_model()


class PomodoroApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='corgi',
            email='corgi@example.com',
            password='StrongPass123!',
        )

    def test_session_creation_requires_auth(self):
        response = self.client.post(
            '/api/pomodoro/sessions/',
            {'duration_minutes': 25},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_save_session_and_read_stats(self):
        self.client.force_authenticate(user=self.user)

        create_response = self.client.post(
            '/api/pomodoro/sessions/',
            {'duration_minutes': 25},
            format='json',
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FocusSession.objects.count(), 1)

        old_session = FocusSession.objects.create(user=self.user, duration_minutes=40)
        FocusSession.objects.filter(pk=old_session.pk).update(
            completed_at=timezone.now() - timedelta(days=10)
        )

        stats_response = self.client.get('/api/pomodoro/stats/')

        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
        self.assertEqual(stats_response.data['today'], 25)
        self.assertEqual(stats_response.data['week'], 25)
        self.assertEqual(stats_response.data['month'], 65)
        self.assertEqual(stats_response.data['total_sessions'], 2)
