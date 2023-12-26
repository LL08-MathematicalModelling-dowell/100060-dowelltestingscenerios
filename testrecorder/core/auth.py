
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from youtube.models import UserProfile  # Replace with your user model

class GoogleAPIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.META.get('HTTP_API_KEY')

        if not api_key:
            return None

        try:
            user = UserProfile.objects.get(api_key=api_key)
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('Invalid API key')

        return (user, None)
