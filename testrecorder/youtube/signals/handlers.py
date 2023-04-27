from django.dispatch import receiver
from ..models import YoutubeUserCredential
from allauth.account.signals import user_logged_in
from django.core.cache import cache
import datetime


@receiver(user_logged_in)
def get_user(sender, **kwargs):
    """A signal handler that is called when ever a user is logged in"""
    # prints a message indicating that the user_logged_in signal handler was called
    print('====== User logged in signal handler ===== ')

    # extract the 'request' and 'user' objects from the signal 'kwargs' parameter
    request = kwargs['request']
    user = kwargs['user']

    # retrieve the 'oauth_data' token from the cache
    token = cache.get('oauth_data')

    # Parse the input string into a datetime object
    dt = datetime.datetime.strptime(
        str(token.expires_at), '%Y-%m-%d %H:%M:%S.%f%z')
    # Convert the datetime object to UTC
    dt_utc = dt.astimezone(datetime.timezone.utc)
    # Format the datetime object as an ISO 8601 string
    iso_string = dt_utc.strftime('%Y-%m-%dT%H:%M:%S.%fZ')

    # create a dictionary with the required fields for the credentials
    # and sets the 'expiry' field to the ISO formatted string
    credentials = {
        "token": token.token,
        "refresh_token": token.token_secret,
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": "1012189436187-nk0sqhbhfodo72v5qc037nngs3hh4ojm.apps.googleusercontent.com",
        "client_secret": "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",
        "scopes": [
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "openid",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/youtube.readonly"
        ],
        "expiry": iso_string,
    }

    try:
        # tries to retrieve an existing YoutubeUserCredential object for the logged-in user
        youtube_user = YoutubeUserCredential.objects.get(user=user)
        # prints a message indicating that the user already exists for debugging purposes
        print('User aready exist')
    except Exception:
        # if no YoutubeUserCredential object exists for the logged-in user, creates a new one
        youtube_user, created = YoutubeUserCredential.objects.get_or_create(
            user=user, credential=credentials)
        youtube_user.save()

     # delete the 'oauth_data' token from the cache
    cache.delete('oauth_data')

    # returns the 'user' object from the signal 'kwargs' parameter
    return (kwargs['user'])
