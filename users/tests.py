from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class UserApiTests(APITestCase):
    def test_register_returns_tokens_and_user(self):
        response = self.client.post(
            '/api/register/',
            {
                'username': 'corgi',
                'email': 'corgi@example.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['username'], 'corgi')

    def test_login_accepts_email_and_returns_tokens(self):
        User.objects.create_user(
            username='corgi',
            email='corgi@example.com',
            password='StrongPass123!',
        )

        response = self.client.post(
            '/api/login/',
            {
                'login': 'corgi@example.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['tokens'])

    def test_profile_and_password_change_require_auth(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(
            '/api/change-password/',
            {'current_password': 'x', 'new_password': 'y'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_update_profile_and_theme(self):
        user = User.objects.create_user(
            username='corgi',
            email='corgi@example.com',
            password='StrongPass123!',
        )
        self.client.force_authenticate(user=user)

        profile_response = self.client.patch(
            '/api/profile/',
            {'birthdate': '2024-03-11', 'avatar': 'fa-cat'},
            format='json',
        )
        theme_response = self.client.put('/api/theme/', {'theme': 'dark'}, format='json')

        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['user']['avatar'], 'fa-cat')
        self.assertEqual(theme_response.status_code, status.HTTP_200_OK)
        self.assertEqual(theme_response.data['theme'], 'dark')

        user.refresh_from_db()
        self.assertEqual(str(user.birthdate), '2024-03-11')
        self.assertEqual(user.avatar, 'fa-cat')
        self.assertEqual(user.theme, 'dark')
