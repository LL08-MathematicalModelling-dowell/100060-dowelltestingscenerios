
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from youtube.models import UserProfile


class APIKeyAuthentication(BaseAuthentication):
    """ Custom API Key bases autehnticaation class """
    def authenticate(self, request):
        """ Overriding the base authenticate method """
        api_key = request.headers.get('Authorization')
        if not api_key or not api_key.startswith('API-KEY '):
            return None

        api_key = api_key.split(' ')[1]
        try:
            user_profile = UserProfile.objects.get(api_key=api_key)
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('Invalid API key')

        return (user_profile.user, None)
