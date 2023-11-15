import json
from django.core.cache import cache
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from .models import YoutubeUserCredential



def get_user_cache_key(user_id, view_url):
    return f'user_{user_id}_view_{view_url}'



def create_user_youtube_object(request):
    """
    Create a YouTube object using the v3 version of the API and
    the authenticated user's credentials.
    """
    print('Creating youtube object...')
    try:
        try:
            cache_key = get_user_cache_key(request.user.id, 'youtube_credenial_object')
            youtube, credentials = cache.get(cache_key)
            if youtube and credentials:
                return youtube, credentials
        except Exception:
            pass

        # Retrieve the YoutubeUserCredential object associated with the authenticated user
        youtube_user = YoutubeUserCredential.objects.get(user=request.user)

        # Retrieve the user's credentials associated with the YoutubeUserCredential object
        credentials_data = youtube_user.credential
        try:
            # Convert the JSON string to a dictionary
            credentials_data_dict = json.loads(credentials_data)
            # Create credentials from the dictionary
            credentials = Credentials.from_authorized_user_info(info=credentials_data_dict)
        except Exception as e:
            credentials = Credentials.from_authorized_user_info(info=credentials_data)
        try:
            # Check if the access token has expired
            if credentials.expired:
                # Import the modules required to refresh the access token
                import google.auth.transport.requests

                # Create a request object using the credentials
                google_request = google.auth.transport.requests.Request()

                # Refresh the access token using the refresh token
                credentials.refresh(google_request)

                # Update the stored credential data with the refreshed token
                youtube_user.credential = credentials.to_json()
                youtube_user.save()
                # print('Access token refreshed!')
        except Exception as e:
            # Handle any error that occurred while refreshing the access token
            # print(f'An error occurred: {e}')
            return None, None

        # Create a YouTube object using the v3 version of the API and the retrieved credentials
        youtube = build('youtube', 'v3', credentials=credentials, cache_discovery=False)
        
        if cache_key:
            # Cache the youtube object
            cache.set(cache_key, (youtube, credentials), 86400)

        return youtube, credentials
    except YoutubeUserCredential.DoesNotExist:
        return None, None
