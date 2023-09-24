# import os
import json
import os
from django.dispatch import receiver
import requests
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

    user_email = user.email
    print('==== user Email =====> ', user.email)
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
        "client_id": os.environ.get('CLIENT_ID'),
        "client_secret": os.environ.get('CLIENT_SECRET'),
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

    db_status = is_available_in_db(user_email)
    print('Check response ==> ', db_status)

    if db_status is False:
        print('inserting user credential into dowell database...')
        insert_response = insert_user_credential_into_dowell_connection_db(
            email=user_email, credential=credentials)

        print(f"{user.username}'s credentials saved successfully!!"
              if insert_response.get('isSuccess') == True else 'Failed to save user credential')
    else:
        print('Credential not saved beacause record already exist!!')

     # delete the 'oauth_data' token from the cache
    cache.delete('oauth_data')

    # returns the 'user' object from the signal 'kwargs' parameter
    return (kwargs['user'])


def is_available_in_db(email) -> bool:
    """
    Checks if record already exist in the database'

    Return:
        True: If record exist in the database.
        False: If record is not in the database.
    """
    url = "http://100002.pythonanywhere.com/"

    payload = json.dumps({
        "cluster": "ux_live",
        "database": "ux_live",
        "collection": "credentials",
        "document": "credentials",
        "team_member_ID": "1200001",
        "function_ID": "ABCDE",
        "command": "find",
        "field": {
            'user_email': email
        },
        "update_field": {
            "order_nos": 21
        },
        "platform": "bangalore"
    })
    headers = {
        'Content-Type': 'application/json'
    }

    response = requests.request(
        "POST", url, headers=headers, data=payload).json()

    if response.get('data') is None:
        return False

    print("xxx DB Response xx=> ", response)
    return True


def insert_user_credential_into_dowell_connection_db(email, credential):
    """
    Inserts a new user youtube info record into the company's database

    Return:
        Json response from the database.
    """

    url = "http://100002.pythonanywhere.com/"

    payload = json.dumps({
        "cluster": "ux_live",
        "database": "ux_live",
        "collection": "credentials",
        "document": "credentials",
        "team_member_ID": "1200001",
        "function_ID": "ABCDE",
        "command": "insert",
        "field": {
            'user_email': email,
            'email_credentials': credential
        },
        "update_field": {
            "order_nos": 21
        },
        "platform": "bangalore"
    })
    headers = {
        'Content-Type': 'application/json'
    }

    response = requests.request(
        "POST", url, headers=headers, data=payload).json()
    print('=== Insert Response ===> ',response)
    return response
