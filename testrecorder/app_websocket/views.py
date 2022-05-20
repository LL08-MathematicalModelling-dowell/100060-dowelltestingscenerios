from django.shortcuts import render

# Create your views here.

def videos(request):
    #return render(request,'websocket_test.html',context={'text':"hello world"})
    return render(request,'websocket_developer.html',context={'text':"hello world"})