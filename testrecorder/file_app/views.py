from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .serializers import FileSerializer
import random
from django.conf import settings

from mega import Mega
import json
import requests
from .models import MegaTestRecord
import os



class FileView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def upload_file_to_megadrive(self,file_to_upload):
        """Uploads a file to mega drive."""
        try:
            # Get dowell megadrive username and password
            url = 'http://100045.pythonanywhere.com/dowellmega'
            headers = {'content-type': 'application/json'}
            response = requests.post(url = url,headers=headers)
            responses = json.loads(response.text)
            #print("responses: ",responses)
            
            # Start the upload process
            mega=Mega()
            m = mega.login(responses["username"],responses["password"])
            # Get the destination folder
            folder = m.find('test_recording_application_V1')
            file = m.upload(file_to_upload, folder[0])
            upload_link = m.get_upload_link(file)
            #print("new upload_link: ", upload_link)
            return upload_link         
        except Exception as err:
            print("Error while uploading file to megadrive: " + str(err))
            return False

    def clean_up(self,file_to_delete):
        """Deletes files that have been uploaded to mega drive"""
        if os.path.exists(file_to_delete):
            os.remove(file_to_delete)

    def post(self, request, *args, **kwargs):
        file_serializer = FileSerializer(data=request.data)
        print(request.data)
        
        if file_serializer.is_valid():
            #file_serializer.save()
            
            # Object to store mega drive records details
            self.megadrive_record = MegaTestRecord()
            self.megadrive_record.user_name = request.data['user_name']
            self.megadrive_record.test_description = request.data['test_description']
            self.megadrive_record.test_name = request.data['test_name']

            # Process keylog file
            try:
                self.keylog_file_name=request.data['key_log_file'].name
                #print("Keylog File Name: ",self.keylog_file_name)

                # save keylog file
                keylog_filedata=request.data['key_log_file']
                self.keylog_recording_file_path = settings.MEDIA_ROOT+"/"+self.keylog_file_name
                #print("keylog_recording_file_path: ",self.keylog_recording_file_path)
                with open(self.keylog_recording_file_path, 'ab+') as destination:
                    for chunk in keylog_filedata.chunks():
                        destination.write(chunk)

                # upload key log file
                file_name = self.keylog_recording_file_path
                megadrive_file_link = self.upload_file_to_megadrive(file_name)
                if megadrive_file_link == False:
                    msg = "Keylog File upload to mega drive failed!"
                    #print(msg)
                    self.clean_up(self.keylog_recording_file_path)
                    return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                else:
                    self.megadrive_record.key_log_file = megadrive_file_link
                    #print("keylog_megadrive_file_link: ", megadrive_file_link)
                    self.clean_up(self.keylog_recording_file_path)
            except Exception as err:
                print("Error while handling keylog file: " + str(err))

            # Process webcam file
            try:
                self.webcam_file_name=request.data['webcam_file']
                #print("Webcam File Name: ",self.webcam_file_name)
                self.webcam_recording_file_path = settings.MEDIA_ROOT+"/"+self.webcam_file_name
                #print("webcam_recording_file_path: ",self.webcam_recording_file_path)

                # upload Webcam file
                file_name = self.webcam_recording_file_path
                megadrive_file_link = self.upload_file_to_megadrive(file_name)
                if megadrive_file_link == False:
                    msg = "Webcam File upload to mega drive failed!"
                    #print(msg)
                    self.clean_up(self.webcam_recording_file_path)
                    return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                else:
                    self.megadrive_record.webcam_file = megadrive_file_link
                    #print("webcam_megadrive_file_link: ", megadrive_file_link)
                    self.clean_up(self.webcam_recording_file_path)
            except Exception as err:
                print("Error while handling webcam file: " + str(err))

            # Process screen file
            try:
                self.screen_file_name=request.data['screen_file']
                #print("Screen File Name: ",self.screen_file_name)
                self.screen_recording_file_path = settings.MEDIA_ROOT+"/"+self.screen_file_name
                #print("screen_recording_file_path: ",self.screen_recording_file_path)

                # upload screen file
                file_name = self.screen_recording_file_path
                megadrive_file_link = self.upload_file_to_megadrive(file_name)
                if megadrive_file_link == False:
                    msg = "Screen File upload to mega drive failed!"
                    #print(msg)
                    self.clean_up(self.screen_recording_file_path)
                    return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                else:
                    self.megadrive_record.screen_file = megadrive_file_link
                    #print("screen_megadrive_file_link: ", megadrive_file_link)
                    self.clean_up(self.screen_recording_file_path)
            except Exception as err:
                print("Error while handling screen file: " + str(err))

            # Process merged file
            try:
                self.merged_file_name=request.data['merged_webcam_screen_file']
                #print("Merged File Name: ",self.merged_file_name)
                self.merged_recording_file_path = settings.MEDIA_ROOT+"/"+self.merged_file_name
                #print("merged_recording_file_path: ",self.merged_recording_file_path)

                # upload merged file
                file_name = self.merged_recording_file_path
                megadrive_file_link = self.upload_file_to_megadrive(file_name)
                if megadrive_file_link == False:
                    msg = "Merged File upload to mega drive failed!"
                    #print(msg)
                    self.clean_up(self.merged_recording_file_path)
                    return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                else:
                    self.megadrive_record.merged_webcam_screen_file = megadrive_file_link
                    #print("merged_megadrive_file_link: ", megadrive_file_link)
                    self.clean_up(self.merged_recording_file_path)
            except Exception as err:
                print("Error while handling merged file: " + str(err))


            # Save record in database
            self.megadrive_record.save()

            return Response(file_serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("file_serializer.errors: ", file_serializer.errors)
            return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BytesView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        #print(request.data)
        filedata=request.data['video_bytes']
        file_name=request.data['fileName']
        #print("file_name: ",file_name)
        recording_file_path = settings.MEDIA_ROOT+"/"+file_name
        #print("recording_file_path: ",recording_file_path)

        with open(recording_file_path, 'ab+') as destination:
            for chunk in filedata.chunks():
                destination.write(chunk)
        return Response("Bytes Received", status=status.HTTP_201_CREATED)
