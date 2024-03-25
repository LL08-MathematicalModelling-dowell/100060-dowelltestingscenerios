from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from django.http import HttpRequest, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from youtube.forms import CreatePlaylist
from youtube.models import UserProfile


class PrivacyView(TemplateView):
    """ Privacy Page"""
    template_name = 'privacy.html'

    def get(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        return render(request, self.template_name)


class HomePageView(TemplateView):
    """Home page view class"""
    template_name = 'home.html'

    def get(self, request, *args, **kwargs):
        """Handles get requests to '/'"""
        add_playlist = CreatePlaylist()
        context_dict = {'add_playlist': add_playlist}
        if request.user.is_authenticated:
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                context_dict['user_profile'] = user_profile
            except UserProfile.DoesNotExist:
                context_dict['user_profile'] = None

        return render(request, self.template_name, context_dict)


class AboutPageView(TemplateView):
    template_name = 'about.html'


def library_page(request):
    return render(request, 'library.html')
