from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Create your views here.

def videos(request):
    #return render(request,'websocket_test.html',context={'text':"hello world"})
    #return render(request,'websocket_developer.html',context={'text':"hello world"})
    return render(request,'taskid_websocket_developer.html')

class ReceiveTaskIdView(APIView):
    """
        Webhook to be called by clickup webhook server
        Expects to receive newly created clickup task data
    """

    def post(self, request, *args, **kwargs):

        print("Request Data: ", request.data)

        # Notify connected websockets
        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            'notification_group',
            {'type': 'send_message', 'message': request.data}
        )

        return Response("TASK ID Received", status=status.HTTP_200_OK)