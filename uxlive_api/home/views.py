from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import HttpRequest, HttpResponse


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
            user_profile = UserProfile.objects.get(user=request.user)
            context_dict['user_profile'] = user_profile
        return render(request, self.template_name, context_dict)


class AboutPageView(TemplateView):
    template_name = 'about.html'


def library_page(request):
    return render(request, 'library.html')
