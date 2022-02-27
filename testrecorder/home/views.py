from django.views.generic import TemplateView
from django.shortcuts import render
#from .models import GeeksModel


class HomePageView(TemplateView):
    template_name = 'home.html'



 
 
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
    print("screen_link: ",screen_file)
    context["webcam_link"] = webcam_file
    context['screen_link'] = screen_file
    context["merged_link"] = merged_file

    print("context: ",context)

 
    # add the dictionary during initialization
    #context["dataset"] = GeeksModel.objects.all()
         
    return render(request, "view_records.html", context)

