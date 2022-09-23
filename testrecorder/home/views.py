from django.views.generic import TemplateView
from django.shortcuts import render
#from .models import GeeksModel
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class HomePageView(TemplateView):
    template_name = 'home.html'
    #template_name = 'not_working.html'
    #template_name = 'calendly.html'


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
