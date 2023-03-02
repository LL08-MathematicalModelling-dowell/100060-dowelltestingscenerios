from django.dispatch import receiver
from .models import YouTubeUser
from allauth.socialaccount.signals import social_account_updated, social_account_added, social_account_removed





@receiver(social_account_removed)
def youtube_auth_callback(sender, request, sociallogin, **kwargs):
    print(f'======== User {sociallogin.user.username } removed =======')

@receiver([social_account_added]) #[social_account_updated, 
def youtube_auth_callback(request, sociallogin, **kwargs):
    ''' 
    This is a signal reciever that recieves social_account_updated, social_account_added from
    google Oath2 and saves the account tokens in database
    '''
    print('=============== Account Signal Reciever ===============')
    if sociallogin.account.provider == 'google':
        # Save the user's credentials and YouTube information to the database
        youtube_user, created = YouTubeUser.objects.get_or_create(
            user=request.user)
        youtube_user.access_token =  sociallogin.token.token
        youtube_user.refresh_token = sociallogin.token.token_secret
        youtube_user.save()

        print(
            'User logged in with Google account and YouTube credentials saved to the database.')
    else:
        print(
            'User logged into an account that is not a Google')

