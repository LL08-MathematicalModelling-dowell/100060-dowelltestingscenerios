from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .serializers import FileSerializer, MegaFileSerializer, VpsFileSerializer, VpsIncomingFileSerializer
import random
from django.conf import settings

#from mega import Mega
from .models import MegaTestRecord
from .models import VpsTestRecord
import os
import ffmpeg
import json
from . import youtube_api
import shutil
import re
import requests
from django.http import JsonResponse
from dotenv import load_dotenv
load_dotenv()
permanent_files_dir = settings.PERMANENT_FILES_ROOT
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class FileView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    keylog_recording_file_path = ""
    beanote_recording_file_path = ""
    webcam_recording_file_path = ""
    screen_recording_file_path = ""
    merged_recording_file_path = ""

    def create_recording_folder(self, user_name, user_time_stamp):
        """Creates a folder for storing user files"""

        # Create username directory
        path = ""
        try:
            # username directory path
            path = os.path.join(permanent_files_dir, user_name)
            os.mkdir(path)
        except OSError as error:
            print(error)
            if not os.path.isdir(path):
                return False, ""

        # Create second directory
        try:
            path2 = ""
            # user time stamp directory path
            split_timestamp = user_time_stamp.split("_T")
            print("Split Time Stamp: ", split_timestamp)
            print("Split Time Stamp Date: ", split_timestamp[0])
            path2 = os.path.join(path, split_timestamp[0])
            os.mkdir(path2)
            return True, path2
        except OSError as error:
            print(error)
            if os.path.isdir(path2):
                return True, path2
            else:
                return False, path2

    def convert_file_path_to_link(self, the_file_path):
        """Converts a file path to a usable link"""

        # Remove base directory
        no_base_dir = the_file_path.replace(
            os.path.normpath(settings.BASE_DIR), "")

        # remove double backward slashes
        no_double_slashes = no_base_dir.replace("\\\\", "/")

        # remove single backward slashes
        no_single_slashes = no_double_slashes.replace("\\", "/")

        return no_single_slashes

    def note_organiser(self,task_id):
        """
            Gets sections of a clickup task notes.
            task_id is the task to fetch.
        """

        # Fetch task json data from clickup API
        #url = "https://api.clickup.com/api/v2/task/32pk9rp/"
        url = 'https://api.clickup.com/api/v2/task/{}/'.format(task_id)
        print("url: ", url)
        headers = {"Authorization": "pk_49467380_UI2LTGSATFMRPLZMGNH31AET9KQ95TFJ"}
        response = requests.get(url, headers=headers)
        print("Status Code", response.status_code)
        #print("JSON Response ", response.json())
        status_code = response.status_code
        data = response.json()

        # Failed to get task notes
        if status_code != 200:
            return False

        x = data["text_content"]

        ''' seperating attendence and topics sections'''

        list_1 = x.split('Topics Discussed\n', 1)

        '''Seperating topics and random notes'''
        list_2 = list_1[1].split('\nRandom Notes')
        random = list_2[1]

        '''further seperating each topic as an item in a list'''

        list_3 = list_2[0].split('\n\n')
        # print(list_3)
        # print(len(list_3))

        '''#finding all topic names'''
        topics_list = []
        for i in list_3:
            m = re.search('-(.+?)\n', i)
            n = m.group(1)
            topics_list.append(n)

        '''Temp Dictionary'''
        d = dict(i.split('\n', 1)for i in list_3)

        '''finding all notes'''
        notes_list = list(d.values())

        '''Arranging data in proper required order'''
        arranged_list = []
        for i in range(0, len(topics_list)):
            doc = {"Subject": topics_list[i],
                "Notes": notes_list[i]}
            arranged_list.append(doc)

        return arranged_list, random

    def post(self, request, *args, **kwargs):
        file_serializer = VpsIncomingFileSerializer(data=request.data)

        print("Request Data: ", request.data)

        if file_serializer.is_valid():
            print("self.parser_classes: ", self.parser_classes)

            # Object to store storage vps records details
            self.megadrive_record = VpsTestRecord()
            self.megadrive_record.user_name = request.data['user_name']
            self.megadrive_record.test_description = request.data['test_description']
            self.megadrive_record.test_name = request.data['test_name']
            self.megadrive_record.user_files_timestamp = request.data['user_files_timestamp']

            # Process Clickup Task
            try:
                if 'clickupTaskID' in request.data.keys():
                    self.clickupTaskID = request.data['clickupTaskID']
                    print("Clickup Task ID: ", self.clickupTaskID)

                    # Get the notes
                    topics_notes,random_notes = self.note_organiser(self.clickupTaskID)

                    # Don't proceed if there was a problem getting topics notes or random notes
                    if topics_notes:
                        print("topics_notes: ", topics_notes)
                    else:
                        msg = "Failed to get topics_notes"
                        print(msg)
                        raise Exception(msg)

                    if random_notes:
                        print("random_notes: ", random_notes)
                    else:
                        msg = "Failed to get random_notes"
                        print(msg)
                        raise Exception(msg)
                    
                    # Add notes to global data object
                    topicsNotes = {"Topics": topics_notes}
                    randomNotes = {"Random_Notes": random_notes}
                    Clickup_Notes = [topicsNotes,randomNotes]
                    #print("Clickup_Notes: ",json.dumps(Clickup_Notes))
                    self.megadrive_record.clickup_task_notes = Clickup_Notes
                else:
                    print("Clickup Task ID Not Available!")
            except Exception as err:
                msg = "Error while handling Clickup Task: " + str(err)
                print(msg)
                #msg = str(err)
                msg_dict = {"error_msg": msg}
                # return Response(json_msg, status=status.HTTP_400_BAD_REQUEST)
                return JsonResponse(status=status.HTTP_400_BAD_REQUEST, data=msg_dict)

            # Process keylog file
            try:
                self.keylog_file_name = request.data['key_log_file'].name
                print("Keylog File Name: ", self.keylog_file_name)

                # Create folder to store the files
                folder_created, new_path = self.create_recording_folder(
                    self.megadrive_record.user_name, self.megadrive_record.user_files_timestamp)

                if folder_created:
                    # save keylog file
                    keylog_filedata = request.data['key_log_file']
                    self.keylog_recording_file_path = new_path+"/"+self.keylog_file_name
                    print("keylog_recording_file_path: ",
                          self.keylog_recording_file_path)
                    with open(self.keylog_recording_file_path, 'wb+') as destination:
                        for chunk in keylog_filedata.chunks():
                            destination.write(chunk)

                    self.megadrive_record.key_log_file = self.convert_file_path_to_link(
                        self.keylog_recording_file_path)
                else:
                    msg = "Failed to save keylog file"
                    return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as err:
                print("Error while handling keylog file: " + str(err))

            # Process Beanote file
            try:
                self.beanote_file_name = request.data['beanote_file'].name
                print("Beanote File Name: ", self.beanote_file_name)

                # Create folder to store the files
                folder_created, new_path = self.create_recording_folder(
                    self.megadrive_record.user_name, self.megadrive_record.user_files_timestamp)

                if folder_created:
                    # save beanote file
                    beanote_filedata = request.data['beanote_file']
                    self.beanote_recording_file_path = new_path+"/"+self.beanote_file_name
                    print("beanote_recording_file_path: ",
                          self.beanote_recording_file_path)
                    with open(self.beanote_recording_file_path, 'wb+') as destination:
                        for chunk in beanote_filedata.chunks():
                            destination.write(chunk)

                    self.megadrive_record.beanote_file = self.convert_file_path_to_link(
                        self.beanote_recording_file_path)
                else:
                    msg = "Failed to save beanote file"
                    return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as err:
                print("Error while handling beanote file: " + str(err))

            # Process webcam file
            try:
                self.webcam_file_name = request.data['webcam_file']
                print("Webcam File Name: ", self.webcam_file_name)

                if 'https://youtu.be' in self.webcam_file_name:
                    # set webcam file youtube video link
                    self.webcam_recording_file_path = self.webcam_file_name
                    print("webcam_recording_file_path: ",
                          self.webcam_recording_file_path)
                    self.megadrive_record.webcam_file = self.webcam_recording_file_path
                else:
                    # Create folder to store the files
                    folder_created, new_path = self.create_recording_folder(
                        self.megadrive_record.user_name, self.megadrive_record.user_files_timestamp)

                    if folder_created:
                        # Copy webcam file from temporary folder to permanent folder
                        self.webcam_recording_file_path = new_path+"/"+self.webcam_file_name
                        print("webcam_recording_file_path: ",
                              self.webcam_recording_file_path)

                        source_path = settings.TEMP_FILES_ROOT+"/"+self.webcam_file_name
                        if os.path.exists(source_path):
                            shutil.move(
                                source_path, self.webcam_recording_file_path)

                        self.megadrive_record.webcam_file = self.convert_file_path_to_link(
                            self.webcam_recording_file_path)
                    else:
                        msg = "Failed to save webcam file"
                        return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as err:
                print("Error while handling webcam file: " + str(err))

            # Process screen file
            try:
                self.screen_file_name = request.data['screen_file']
                print("Screen File Name: ", self.screen_file_name)

                if 'https://youtu.be' in self.screen_file_name:
                    # set screen file youtube video link
                    self.screen_recording_file_path = self.screen_file_name
                    print("screen_recording_file_path: ",
                          self.screen_recording_file_path)
                    self.megadrive_record.screen_file = self.screen_recording_file_path
                else:
                    # Create folder to store the files
                    folder_created, new_path = self.create_recording_folder(
                        self.megadrive_record.user_name, self.megadrive_record.user_files_timestamp)

                    if folder_created:
                        # Copy screen file from temporary folder to permanent folder
                        self.screen_recording_file_path = new_path+"/"+self.screen_file_name
                        print("screen_recording_file_path: ",
                              self.screen_recording_file_path)

                        source_path = settings.TEMP_FILES_ROOT+"/"+self.screen_file_name
                        if os.path.exists(source_path):
                            shutil.move(
                                source_path, self.screen_recording_file_path)

                        self.megadrive_record.screen_file = self.convert_file_path_to_link(
                            self.screen_recording_file_path)
                    else:
                        msg = "Failed to save screen file"
                        return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

            except Exception as err:
                print("Error while handling screen file: " + str(err))

            # Process merged file
            try:
                self.merged_file_name = request.data['merged_webcam_screen_file']
                print("Merged File Name: ", self.merged_file_name)

                # set merged file youtube video link
                self.megadrive_record.merged_webcam_screen_file = self.merged_file_name
            except Exception as err:
                print("Error while handling merged file: " + str(err))

            # Save record in database
            self.megadrive_record.save()

            # Modify file paths to be links
            """self.megadrive_record.webcam_file = self.convert_file_path_to_link(self.megadrive_record.webcam_file)
            self.megadrive_record.screen_file = self.convert_file_path_to_link(self.megadrive_record.screen_file)
            self.megadrive_record.beanote_file = self.convert_file_path_to_link(self.megadrive_record.beanote_file)
            self.megadrive_record.key_log_file = self.convert_file_path_to_link(self.megadrive_record.key_log_file)"""
            mega_file_serializer = VpsFileSerializer(self.megadrive_record)
            #print("settings.BASE_DIR: ",settings.BASE_DIR)

            file_links = mega_file_serializer.data
            print("file_links: ", file_links)
            return Response(file_links, status=status.HTTP_201_CREATED)
        else:
            print("file_serializer.errors: ", file_serializer.errors)

            return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BytesView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        # print(request.data)
        filedata = request.data['video_bytes']
        file_name = request.data['fileName']
        #print("file_name: ",file_name)
        recording_file_path = settings.MEDIA_ROOT+"/"+file_name
        #print("recording_file_path: ",recording_file_path)

        with open(recording_file_path, 'ab+') as destination:
            for chunk in filedata.chunks():
                destination.write(chunk)
        return Response("Bytes Received", status=status.HTTP_201_CREATED)


class CreateBroadcastView(APIView):
    #parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        videoPrivacyStatus = "private"
        testNameValue = "Test1"
        stream_dict = youtube_api.create_broadcast(
            videoPrivacyStatus, testNameValue)
        print("stream_dict: ", stream_dict)

        return Response("Bytes Received", status=status.HTTP_201_CREATED)

