from django.dispatch import receiver
from ..models import YouTubeUser
# from .signals import user_credential
from allauth.account.signals import user_logged_in
from django.core.cache import cache
import datetime


@receiver(user_logged_in)
def get_user(sender, **kwargs):
    print('====== User logged in signal handler ===== ')
    request = kwargs['request']
    user = kwargs['user']
    # credentials = request.session['oauth_data']
    token = cache.get('oauth_data')
    print('credetial token>>> ', type(token))

    # Parse the input string into a datetime object
    dt = datetime.datetime.strptime(
        str(token.expires_at), '%Y-%m-%d %H:%M:%S.%f%z')
    # Convert the datetime object to UTC
    dt_utc = dt.astimezone(datetime.timezone.utc)
    # Format the datetime object as an ISO 8601 string
    iso_string = dt_utc.strftime('%Y-%m-%dT%H:%M:%S.%fZ')

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
        youtube_user = YouTubeUser.objects.get(user=user)
        print('User aready exist')
    except Exception:
        youtube_user, created = YouTubeUser.objects.get_or_create(
            user=user, credential=credentials)
        # user=user, token=token.token, refresh_token=token.token_secrete)
        # if created:
        youtube_user.save()
    cache.delete('oauth_data')
    return (kwargs['user'])

