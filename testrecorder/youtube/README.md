##        youtube.views_w.UserChannels
        =============================

#        Availabe at 'http://127.0.0.1/youtube/channels'
        ===============================================
This is a Django REST Framework view class named UserChannels which inherits from APIView class.
The purpose of this class is to retrieve the YouTube channels of the currently logged-in user. 
The class requires the user to be authenticated, and it renders the response in JSON format.

The permission_classes variable is set to [IsAuthenticated], which is a built-in Django REST Framework class that
verifies if the user is authenticated before allowing access to the view.

The renderer_classes variable is set to [JSONRenderer], which specifies that the response should be rendered in JSON format.

The get method is defined to handle HTTP GET requests sent to the view. The method tries to retrieve the YoutubeUserCredential object associated with the currently logged-in user.
If the user doesn't have a YoutubeUserCredential object, it returns a 401 Unauthorized response with an error message indicating that the account is not a Google account.

If the user has a YoutubeUserCredential object, the method retrieves the credentials associated with the YoutubeUserCredential object using the Credentials.from_authorized_user_info method.
Then, it uses the build method from the googleapiclient.discovery module to create a YouTube object with the v3 version of the API and the retrieved credentials.

The method then tries to retrieve the channels associated with the user's account by calling the list method on the youtube.channels() object.
The part parameter is set to snippet, which specifies that only the basic details about the channels (i.e., their titles) should be retrieved.
The mine parameter is set to True, which specifies that only the channels associated with the currently authenticated user should be returned.

The retrieved channels are then processed into a list of dictionaries that contain the id and title of each channel.
The list of dictionaries is then returned in the response body with a 200 OK status code.

If an exception is raised during any of the above steps, the method returns a 404 Not Found response with an error
message indicating that it was unable to retrieve the user's YouTube channels.

Overall, this class provides a secure way for authenticated users to retrieve their YouTube channels using the YouTube Data API.


##        youtube.signals.handlers.get_user
        =================================
This code defines a signal handler function that listens to the user_logged_in signal sent by Django when a user logs in.

The signal handler extracts the request and user objects from the signal kwargs parameter,
retrieves the token from the cache using the cache.get() method, and converts the token.expires_at attribute
to a UTC ISO 8601 formatted string.

It then creates a credentials dictionary using the token and other required fields,
checks if a YoutubeUserCredential object already exists for the logged-in user, and either
retrieves or creates a new YoutubeUserCredential object with the credentials data.

Finally, it deletes the oauth_data token from the cache using the cache.delete() method and returns the user object.

### NOTE: Add this line to the bottom (just before the return statement) of allauth.providers.oauth.views.OAuth2Adapter.parse_token method:
        #Get user token info
        from django.core.cache import cache
        # save token data in the cache for futher use in the code
        cache.set('oauth_data', token)