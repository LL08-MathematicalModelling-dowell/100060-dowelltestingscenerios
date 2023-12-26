
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from youtube.models import UserProfile  # Replace with your user model


class GoogleAPIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get('Authorization')
        if not api_key or not api_key.startswith('API-KEY '):
            return None

        api_key = api_key.split(' ')[1]  # Extracting the API key from the header
        try:
            user_profile = UserProfile.objects.get(api_key=api_key)
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('Invalid API key')

        return (user_profile.user, None)
