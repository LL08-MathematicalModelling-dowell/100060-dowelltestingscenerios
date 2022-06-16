from django.views.generic import TemplateView
from django.shortcuts import render
#from .models import GeeksModel
from django.views.decorators.csrf import csrf_exempt


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
    print("Request Data: ",request.POST)
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
    print("screen_link: ",screen_file)
    context["webcam_link"] = webcam_file
    context['screen_link'] = screen_file
    context["merged_link"] = merged_file
    context['key_log_file_link'] = key_log_file
    context["beanote_file_link"] = beanote_file

    print("context: ",context)

    return render(request, "view_records.html", context)

