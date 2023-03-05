import asyncio
import json
import logging
from .models import YouTubeUser
from .views import (SCOPES, API_SERVICE_NAME, API_VERSION, CLIENT_SECRETS_FILE)
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from django.shortcuts import redirect
from allauth.socialaccount.models import SocialAccount
from .signals.signals import user_credential
from django.core.cache import cache


logger = logging.getLogger(__name__)


class GoogleCallbackMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if this is a Google callback request
        if request.path.startswith('/accounts/google/login/callback/'):
            print('=============== Account Signal Reciever Middleware===============')
            user_credential.send_robust(self.__class__, code=request.GET['code'])
        response = self.get_response(request)
        return response


'''
class GoogleCallbackMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if this is a Google callback request
        if request.path.startswith('/accounts/google/login/callback/'):
            # Log the request URL and query parameters
            # logger.info(f"Google callback request: {request.get_full_path()}")
            print('=============== Account Signal Reciever Middleware===============')
            code = request.GET['code']
            # user_credential.send_robust(self.__class__, code=code)
            print('code>>> ', code)
            print('=========== EXCH Code ==================')
            flow = Flow.from_client_secrets_file(
                CLIENT_SECRETS_FILE,
                scopes=SCOPES,
                state=request.GET.get('state', ''),
                redirect_uri='http://127.0.0.1:8000/accounts/google/login/callback/',
            )
            # flow.fetch_token(code=code)
            # credentials = flow.credentials
            # print('========= credentials =========> ', credentials)
            # with open('user_youtube_cred.json', "w") as f:
            #     f.write(credentials.to_json())
        response = self.get_response(request)
        return response
'''
