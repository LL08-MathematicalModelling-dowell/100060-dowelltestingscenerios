import json
from django.views.generic import TemplateView
from django.shortcuts import render
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
#from .models import GeeksModel
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from youtube.forms import AddChannelRecord




def validate_youtube_channel(channel_credentials,channel_id):
    """Checks if a youtube channel ID and Credential is valid"""

    try:
        # Build the credentials object
        credentials = Credentials(**channel_credentials)    
        # Build the YouTube API client
        youtube = build('youtube', 'v3', credentials=credentials)
        # Send a GET request to the API to retrieve information about the channel
        response = youtube.channels().list(part='snippet', id=channel_id).execute()
        # Check if the response contains any items
        if 'items' in response:
            return True
        else:
            return False
    except Exception as e:
        print(f'An error occurred: {e}')
        return False


class HomePageView(TemplateView):
    """Home page view class"""

    template_name = 'home.html'
    def get(self, request, *args, **kwargs):
        """Handles get requests to '/'"""
        # create he form object to render
        form = AddChannelRecord()
        return render(request, self.template_name, {'form': form})
    
    def post(self, request, *args, **kwargs):
        """Handles POST requests to '/'"""
        # Get data from request object sent by user
        data = request.POST
        form = AddChannelRecord(data=data)
        if form.is_valid():
            # extract channel_credenials from data object 
            credentials = json.loads(dict(data)['channel_credentials'][0])
            # extract channel_id from data object
            channel_id = data['channel_id']
            if validate_youtube_channel(credentials, channel_id):
                form.save()
                # print('============Vallid form===========')
                return JsonResponse({'message':f'Channel added sucesfully!!'}, status=200)
            else:
                # print('============InVallid form===========')
                return JsonResponse({'message':'Invalid channel!'}, status=400)
        else:
            print(form.errors.as_json())
            return JsonResponse(form.errors, status=400)


class CalendlyPageView(TemplateView):
    template_name = 'calendly.html'


class AboutPageView(TemplateView):
    template_name = 'about.html'


@csrf_exempt
def records_view(request):
    print("Request Data: ", request.POST)
    # dictionary for initial data with
    # field names as keys
    #context ={request.POST}
    #context = request.POST
    context = {}
    #files_links = request.POST
    #screen_file = files_links['screen_file']
    webcam_file = request.POST.get('webcam_link')
    screen_file = request.POST.get('screen_link')
    merged_file = request.POST.get('merged_link')
    key_log_file = request.POST.get('key_log_file_link')
    beanote_file = request.POST.get('beanote_file_link')
    print("screen_link: ", screen_file)
    context["webcam_link"] = webcam_file
    context['screen_link'] = screen_file
    context["merged_link"] = merged_file
    context['key_log_file_link'] = key_log_file
    context["beanote_file_link"] = beanote_file

    print("context: ", context)

    return render(request, "view_records.html", context)


class WebsocketPermissionView(APIView):
    def post(self, request):
        print("request.data: ", request.data)

        try:
            success_feed_back = {"permission_is_granted": True,
                                 "token": "adfaf35234558hkgllg"
                                 }

            failed_feed_back = {"permission_is_granted": False}

            # ToDo: do some checks before retruning feedback
            return Response(success_feed_back, status=status.HTTP_200_OK) # for success
            #return Response(failed_feed_back, status=status.HTTP_400_BAD_REQUEST) # for fail
        except Exception as error:
            failed_feed_back = {"permission_is_granted": False,"status": "error", "data": str(error)}
            return Response(failed_feed_back, status=status.HTTP_400_BAD_REQUEST)
