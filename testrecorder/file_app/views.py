import datetime
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .serializers import FileSerializer, MegaFileSerializer, VpsFileSerializer, VpsIncomingFileSerializer, VpsWebsocketFileSerializer
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
from asgiref.sync import sync_to_async
import threading
from dotenv import load_dotenv
load_dotenv()
permanent_files_dir = settings.PERMANENT_FILES_ROOT


class FileView(APIView):
    parser_classes = (MultiPartParser, FormParser)

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

    def note_organiser(self, task_id):
        """
            Gets sections of a clickup task notes created using the extension.
            task_id is the task to fetch.
        """

        # Fetch task json data from clickup API
        #url = "https://api.clickup.com/api/v2/task/32pk9rp/"
        url = 'https://api.clickup.com/api/v2/task/{}/'.format(task_id)
        print("url: ", url)
        headers = {
            "Authorization": os.getenv("CLICKUP_TOKEN")}
        response = requests.get(url, headers=headers)
        print("Status Code", response.status_code)
        #print("JSON Response ", response.json())
        #print("Response ", response.content.decode())
        status_code = response.status_code
        data = response.json()

        # Failed to get task notes
        if status_code != 200:
            return False, False

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

    def webpage_note_organiser(self, task_id):
        """
            Gets sections of a clickup task notes created using the clickup webpage,
            not the extension.
            task_id is the task to fetch.
        """

        # Fetch task json data from clickup API
        url = 'https://api.clickup.com/api/v2/task/{}/'.format(task_id)
        print("url: ", url)
        headers = {
            "Authorization": "pk_49467380_UI2LTGSATFMRPLZMGNH31AET9KQ95TFJ"}
        response = requests.get(url, headers=headers)
        print("Status Code", response.status_code)
        #print("JSON Response ", response.json())
        status_code = response.status_code

        # Failed to get task notes
        if status_code != 200:
            return False, False

        # Got notes
        data = response.json()
        #print("data: ",data)
        text_content = data["text_content"]
        json_text_content = json.loads(text_content)
        ops = json_text_content["ops"]
        #print("ops: ",ops)

        raw_notes = ""
        for line in ops:
            if "insert" in line:
                line_text = line["insert"]
                raw_notes = raw_notes + str(line_text)
        #print("Raw Notes: ",raw_notes)

        ''' seperating attendence and topics sections'''
        list_1 = raw_notes.split('Topics Discussed\n', 1)

        '''Seperating topics and random notes'''
        list_2 = list_1[1].split('\nRandom Notes')
        random = list_2[1]

        '''further seperating each topic as an item in a list'''
        list_3 = list_2[0].split('\n\n')
        # print(list_3)
        # print(len(list_3))

        '''finding all topic names'''
        topics_and_notes_dictionary = dict()
        current_topic = ""
        for i in list_3:
            # Get a topic
            for line in i.split('\n'):
                # restore line feed
                line = line+"\n"
                #print("line: ",line)
                # Search for a topic
                m = re.search('-(.+?)\n', line)
                # if this is a topic
                if m:
                    n = m.group(1)
                    current_topic = n
                    #print("Topic: ",n)
                else:
                    # it is a note
                    if current_topic in topics_and_notes_dictionary.keys():
                        # Don't add just a line feed as data
                        if line != "\n":
                            topics_and_notes_dictionary[current_topic] = topics_and_notes_dictionary[current_topic] + str(
                                line)
                    else:
                        # Don't add just a line feed as data
                        if line != "\n":
                            topics_and_notes_dictionary[current_topic] = str(
                                line)

        topics_list = list(topics_and_notes_dictionary.keys())
        notes_list = list(topics_and_notes_dictionary.values())
        #print("Topics List: ",topics_list)
        #print("Notes List: ",notes_list)
        #print("No of Topics: ",len(topics_list))
        #print("No of Notes: ",len(notes_list))
        #print("topics_and_notes_dictionary: ",topics_and_notes_dictionary)

        '''Arranging data in proper required order'''
        arranged_list = []
        for i in range(0, len(topics_list)):
            doc = {"Subject": topics_list[i],
                   "Notes": notes_list[i]}
            arranged_list.append(doc)

        return arranged_list, random

    def get_event_id(self):
        """
            Gets an event id.
        """
        dd = datetime.datetime.now()
        time = dd.strftime("%d:%m:%Y,%H:%M:%S")
        url = "https://100003.pythonanywhere.com/event_creation"
        data = {
            "platformcode": "FB",
            "citycode": "101",
            "daycode": "0",
            "dbcode": "pfm",
            "ip_address": "192.168.0.41",
            "login_id": "lav",
            "session_id": "new",
            "processcode": "1",
            "regional_time": time,
            "dowell_time": time,
            "location": "22446576",
            "objectcode": "1",
            "instancecode": "100051",
            "context": "afdafa ",
            "document_id": "3004",
            "rules": "some rules",
            "status": "work",
            "data_type": "learn",
            "purpose_of_usage": "add",
            "colour": "color value",
            "hashtags": "hash tag alue",
            "mentions": "mentions value",
            "emojis": "emojis",
        }
        r = requests.post(url, json=data)
        return r.text

    def dowell_connection_db_insert(self, new_data):
        """
            Inserts a record in to the company's database
        """

        url = "http://100002.pythonanywhere.com/"

        payload = json.dumps({
            "cluster": "ux_live",
            "database": "ux_live",
            "collection": "ux_live_storyboard",
            "document": "ux_live_storyboard",
            "team_member_ID": "1088",
            "function_ID": "ABCDE",
            "command": "insert",
            "field": {
                "user_name": new_data.user_name,
                "test_description": new_data.test_description,
                "test_name": new_data.test_name,
                "user_files_timestamp": new_data.user_files_timestamp,
                "webcam_file": new_data.webcam_file,
                "screen_file": new_data.screen_file,
                "merged_webcam_screen_file": new_data.merged_webcam_screen_file,
                "key_log_file": new_data.key_log_file,
                "beanote_file": new_data.beanote_file,
                "timestamp": datetime.datetime.now().isoformat(),
                "clickup_task_notes": new_data.clickup_task_notes,
                "eventID": new_data.event_id,
                "Account_info": new_data.Account_info,
                "app_type": new_data.app_type
            },
            "update_field": {
                "order_nos": 21
            },
            "platform": "bangalore"
        })
        headers = {
            'Content-Type': 'application/json'
        }

        response = requests.request("POST", url, headers=headers, data=payload)
        print(response.text)
        return response.text

    def post(self, request, *args, **kwargs):
        file_serializer = VpsIncomingFileSerializer(data=request.data)

        # Initialize some variables
        keylog_recording_file_path = ""
        beanote_recording_file_path = ""
        webcam_recording_file_path = ""
        screen_recording_file_path = ""
        merged_recording_file_path = ""
        clickup_task_notes_list = []

        print("Request Data: ", request.data)

        if file_serializer.is_valid():
            print("self.parser_classes: ", self.parser_classes)

            # Object to store storage vps records details
            megadrive_record = VpsTestRecord()
            megadrive_record.user_name = request.data['user_name']
            megadrive_record.test_description = request.data['test_description']
            megadrive_record.test_name = request.data['test_name']
            megadrive_record.user_files_timestamp = request.data['user_files_timestamp']

            # Process app type
            megadrive_record.app_type = "UX_001"

            # Process Clickup Task
            try:
                if 'clickupTaskIDs' in request.data.keys():
                    clickupTaskID = request.data['clickupTaskIDs']
                    print("Clickup Task IDs: ", clickupTaskID)

                    # Convert task id string to a list
                    clickup_task_ids = clickupTaskID.split(",")
                    print("Clickup Task IDs: ", clickup_task_ids)

                    # Get the notes for each task id in list
                    for task_id in clickup_task_ids:
                        try:
                            topics_notes, random_notes = self.note_organiser(
                                task_id)
                        except Exception as err:
                            print(
                                "Trying to use webpage_note_organiser because: " + str(err))
                            topics_notes, random_notes = self.webpage_note_organiser(
                                task_id)
                        #topics_notes,random_notes = "",""

                        # Don't proceed if there was a problem getting topics notes or random notes
                        if topics_notes:
                            print("topics_notes: ", topics_notes)
                            topicsNotes = {"Topics": topics_notes}
                        else:
                            msg = "Failed to get topics_notes for; "+task_id
                            print(msg)
                            raise Exception(msg)

                        if random_notes:
                            print("random_notes: ", random_notes)
                            randomNotes = {"Random_Notes": random_notes}
                        else:
                            msg = "Failed to get random_notes for; "+task_id
                            print(msg)
                            raise Exception(msg)

                        # Add current task id notes to global notes list
                        #topicsNotes = {"Topics": topics_notes}
                        #randomNotes = {"Random_Notes": random_notes}
                        Clickup_Notes = [topicsNotes, randomNotes]
                        clickup_task_notes_list.append(Clickup_Notes)
                    #print("Clickup_Notes: ",json.dumps(Clickup_Notes))
                    megadrive_record.clickup_task_notes = clickup_task_notes_list
                    print("clickup_task_notes_list: ",
                          json.dumps(clickup_task_notes_list))
                else:
                    print("Clickup Task ID Not Available!")
            except Exception as err:
                msg1 = "Error while handling Clickup Task: " + str(err)
                msg = "Failed to get topics_notes for; "+task_id
                print(msg1)
                #msg = str(err)
                msg_dict = {"error_msg": msg}
                # return Response(json_msg, status=status.HTTP_400_BAD_REQUEST)
                return JsonResponse(status=status.HTTP_400_BAD_REQUEST, data=msg_dict)

            # Process keylog file
            try:
                keylog_file_name = request.data['key_log_file'].name
                print("Keylog File Name: ", keylog_file_name)

                # Create folder to store the files
                folder_created, new_path = self.create_recording_folder(
                    megadrive_record.user_name, megadrive_record.user_files_timestamp)

                if folder_created:
                    # save keylog file
                    keylog_filedata = request.data['key_log_file']
                    keylog_recording_file_path = new_path+"/"+keylog_file_name
                    print("keylog_recording_file_path: ",
                          keylog_recording_file_path)
                    with open(keylog_recording_file_path, 'wb+') as destination:
                        for chunk in keylog_filedata.chunks():
                            destination.write(chunk)

                    megadrive_record.key_log_file = self.convert_file_path_to_link(
                        keylog_recording_file_path)
                else:
                    msg = "Failed to save keylog file"
                    return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as err:
                print("Error while handling keylog file: " + str(err))

            # Process Beanote file
            try:
                beanote_file_name = request.data['beanote_file'].name
                print("Beanote File Name: ", beanote_file_name)

                # Create folder to store the files
                folder_created, new_path = self.create_recording_folder(
                    megadrive_record.user_name, megadrive_record.user_files_timestamp)

                if folder_created:
                    # save beanote file
                    beanote_filedata = request.data['beanote_file']
                    beanote_recording_file_path = new_path+"/"+beanote_file_name
                    print("beanote_recording_file_path: ",
                          beanote_recording_file_path)
                    with open(beanote_recording_file_path, 'wb+') as destination:
                        for chunk in beanote_filedata.chunks():
                            destination.write(chunk)

                    megadrive_record.beanote_file = self.convert_file_path_to_link(
                        beanote_recording_file_path)
                else:
                    msg = "Failed to save beanote file"
                    return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as err:
                print("Error while handling beanote file: " + str(err))

            # Process webcam file
            try:
                webcam_file_name = request.data['webcam_file']
                print("Webcam File Name: ", webcam_file_name)

                if 'https://youtu.be' in webcam_file_name:
                    # set webcam file youtube video link
                    webcam_recording_file_path = webcam_file_name
                    print("webcam_recording_file_path: ",
                          webcam_recording_file_path)
                    megadrive_record.webcam_file = webcam_recording_file_path
                else:
                    # Create folder to store the files
                    folder_created, new_path = self.create_recording_folder(
                        megadrive_record.user_name, megadrive_record.user_files_timestamp)

                    if folder_created:
                        # Copy webcam file from temporary folder to permanent folder
                        webcam_recording_file_path = new_path+"/"+webcam_file_name
                        print("webcam_recording_file_path: ",
                              webcam_recording_file_path)

                        source_path = settings.TEMP_FILES_ROOT+"/"+webcam_file_name
                        if os.path.exists(source_path):
                            shutil.move(
                                source_path, webcam_recording_file_path)

                        megadrive_record.webcam_file = self.convert_file_path_to_link(
                            webcam_recording_file_path)
                    else:
                        msg = "Failed to save webcam file"
                        return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as err:
                print("Error while handling webcam file: " + str(err))

            # Process screen file
            try:
                screen_file_name = request.data['screen_file']
                print("Screen File Name: ", screen_file_name)

                if 'https://youtu.be' in screen_file_name:
                    # set screen file youtube video link
                    screen_recording_file_path = screen_file_name
                    print("screen_recording_file_path: ",
                          screen_recording_file_path)
                    megadrive_record.screen_file = screen_recording_file_path
                else:
                    # Create folder to store the files
                    folder_created, new_path = self.create_recording_folder(
                        megadrive_record.user_name, megadrive_record.user_files_timestamp)

                    if folder_created:
                        # Copy screen file from temporary folder to permanent folder
                        screen_recording_file_path = new_path+"/"+screen_file_name
                        print("screen_recording_file_path: ",
                              screen_recording_file_path)

                        source_path = settings.TEMP_FILES_ROOT+"/"+screen_file_name
                        if os.path.exists(source_path):
                            shutil.move(
                                source_path, screen_recording_file_path)

                        megadrive_record.screen_file = self.convert_file_path_to_link(
                            screen_recording_file_path)
                    else:
                        msg = "Failed to save screen file"
                        return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

            except Exception as err:
                print("Error while handling screen file: " + str(err))

            # Process merged file
            try:
                merged_file_name = request.data['merged_webcam_screen_file']
                print("Merged File Name: ", merged_file_name)

                # set merged file youtube video link
                megadrive_record.merged_webcam_screen_file = merged_file_name
            except Exception as err:
                print("Error while handling merged file: " + str(err))

            # Get selected playlist
            if 'Account_info' in request.data.keys():
                Account_info = request.data['Account_info']
                Account_info = json.loads(Account_info)
                print("Account_info: ", Account_info)
                megadrive_record.Account_info = Account_info

            # Get an event id
            event_id = self.get_event_id()
            #event_id = "Testing"
            print("Dowell Event ID: ", event_id)
            megadrive_record.event_id = event_id

            # Save record in database
            # megadrive_record.save()
            # Dowell connection insertion of data
            insert_response = self.dowell_connection_db_insert(megadrive_record)

            mega_file_serializer = VpsFileSerializer(megadrive_record)
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


def save_recording_metadata(request):
    """
        Saves a recording meta data such as test_name.
        requests is a dictionary of the metadata.
    """

    file_serializer = VpsWebsocketFileSerializer(data=request)
    file_view = FileView()

    # Initialize some variables
    keylog_recording_file_path = ""
    beanote_recording_file_path = ""
    webcam_recording_file_path = ""
    screen_recording_file_path = ""
    merged_recording_file_path = ""
    clickup_task_notes_list = []

    print("Request Data: ", request)

    if file_serializer.is_valid():

        # Object to store storage vps records details
        megadrive_record = VpsTestRecord()
        megadrive_record.user_name = request['user_name']
        megadrive_record.test_description = request['test_description']
        megadrive_record.test_name = request['test_name']
        megadrive_record.user_files_timestamp = request['user_files_timestamp']

        # Process app type
        megadrive_record.app_type = "UX_002"

        # Process Clickup Task
        try:
            if 'clickupTaskIDs' in request.keys():
                clickupTaskID = request['clickupTaskIDs']
                print("Clickup Task IDs: ", clickupTaskID)

                # Convert task id string to a list
                clickup_task_ids = clickupTaskID.split(",")
                print("Clickup Task IDs: ", clickup_task_ids)

                # Get the notes for each task id in list
                for task_id in clickup_task_ids:
                    try:
                        topics_notes, random_notes = file_view.note_organiser(
                            task_id)
                    except Exception as err:
                        print(
                            "Trying to use webpage_note_organiser because: " + str(err))
                        topics_notes, random_notes = file_view.webpage_note_organiser(
                            task_id)
                    #topics_notes,random_notes = "",""

                    # Don't proceed if there was a problem getting topics notes or random notes
                    if topics_notes:
                        print("topics_notes: ", topics_notes)
                        topicsNotes = {"Topics": topics_notes}
                    else:
                        msg = "Failed to get topics_notes for; "+task_id
                        print(msg)
                        raise Exception(msg)

                    if random_notes:
                        print("random_notes: ", random_notes)
                        randomNotes = {"Random_Notes": random_notes}
                    else:
                        msg = "Failed to get random_notes for; "+task_id
                        print(msg)
                        raise Exception(msg)

                    # Add current task id notes to global notes list
                    #topicsNotes = {"Topics": topics_notes}
                    #randomNotes = {"Random_Notes": random_notes}
                    Clickup_Notes = [topicsNotes, randomNotes]
                    clickup_task_notes_list.append(Clickup_Notes)
                #print("Clickup_Notes: ",json.dumps(Clickup_Notes))
                megadrive_record.clickup_task_notes = clickup_task_notes_list
                print("clickup_task_notes_list: ",
                      json.dumps(clickup_task_notes_list))
            else:
                print("Clickup Task ID Not Available!")
        except Exception as err:
            msg1 = "Error while handling Clickup Task: " + str(err)
            msg = "Failed to get topics_notes for; "+task_id
            print(msg1)
            raise Exception(msg)

        # Process keylog file
        try:
            keylog_file_name = request['key_log_file']
            print("Keylog File Name: ", keylog_file_name)

            # Create folder to store the files
            folder_created, new_path = file_view.create_recording_folder(
                megadrive_record.user_name, megadrive_record.user_files_timestamp)

            if folder_created:
                # save keylog file
                """keylog_file_name = request['key_log_file']
                keylog_recording_file_path = new_path+"/"+keylog_file_name
                print("keylog_recording_file_path: ",
                      keylog_recording_file_path)
                with open(keylog_recording_file_path, 'wb+') as destination:
                    for chunk in keylog_filedata.chunks():
                        destination.write(chunk)

                megadrive_record.key_log_file = file_view.convert_file_path_to_link(
                    keylog_recording_file_path)"""

                # Copy key log file from temporary folder to permanent folder
                keylog_recording_file_path = new_path+"/"+keylog_file_name
                print("keylog_recording_file_path: ",
                      keylog_recording_file_path)

                source_path = settings.TEMP_FILES_ROOT+"/"+keylog_file_name
                if os.path.exists(source_path):
                    shutil.move(
                        source_path, keylog_recording_file_path)

                megadrive_record.key_log_file = file_view.convert_file_path_to_link(
                    keylog_recording_file_path)
            else:
                msg = "Failed to save keylog file"
                print(msg)
        except Exception as err:
            print("Error while handling keylog file: " + str(err))

        # Process Beanote file
        try:
            beanote_file_name = request['beanote_file']
            print("Beanote File Name: ", beanote_file_name)

            # Create folder to store the files
            folder_created, new_path = file_view.create_recording_folder(
                megadrive_record.user_name, megadrive_record.user_files_timestamp)

            if folder_created:
                # Copy beanote file from temporary folder to permanent folder
                beanote_recording_file_path = new_path+"/"+beanote_file_name
                print("beanote_recording_file_path: ",
                      beanote_recording_file_path)

                source_path = settings.TEMP_FILES_ROOT+"/"+beanote_file_name
                if os.path.exists(source_path):
                    shutil.move(
                        source_path, beanote_recording_file_path)

                megadrive_record.beanote_file = file_view.convert_file_path_to_link(
                    beanote_recording_file_path)
            else:
                msg = "Failed to save beanote file"
                print(msg)
        except Exception as err:
            print("Error while handling beanote file: " + str(err))

        # Process webcam file
        try:
            webcam_file_name = request['webcam_file']
            print("Webcam File Name: ", webcam_file_name)

            if 'https://youtu.be' in webcam_file_name:
                # set webcam file youtube video link
                webcam_recording_file_path = webcam_file_name
                print("webcam_recording_file_path: ",
                      webcam_recording_file_path)
                megadrive_record.webcam_file = webcam_recording_file_path
            else:
                # Create folder to store the files
                folder_created, new_path = file_view.create_recording_folder(
                    megadrive_record.user_name, megadrive_record.user_files_timestamp)

                if folder_created:
                    # Copy webcam file from temporary folder to permanent folder
                    webcam_recording_file_path = new_path+"/"+webcam_file_name
                    print("webcam_recording_file_path: ",
                          webcam_recording_file_path)

                    source_path = settings.TEMP_FILES_ROOT+"/"+webcam_file_name
                    if os.path.exists(source_path):
                        shutil.move(
                            source_path, webcam_recording_file_path)

                    megadrive_record.webcam_file = file_view.convert_file_path_to_link(
                        webcam_recording_file_path)
                else:
                    msg = "Failed to save webcam file"
                    print(msg)
                    #raise Exception(msg)
                    # return Response(msg, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as err:
            print("Error while handling webcam file: " + str(err))

        # Process screen file
        try:
            screen_file_name = request['screen_file']
            print("Screen File Name: ", screen_file_name)

            if 'https://youtu.be' in screen_file_name:
                # set screen file youtube video link
                screen_recording_file_path = screen_file_name
                print("screen_recording_file_path: ",
                      screen_recording_file_path)
                megadrive_record.screen_file = screen_recording_file_path
            else:
                # Create folder to store the files
                folder_created, new_path = file_view.create_recording_folder(
                    megadrive_record.user_name, megadrive_record.user_files_timestamp)

                if folder_created:
                    # Copy screen file from temporary folder to permanent folder
                    screen_recording_file_path = new_path+"/"+screen_file_name
                    print("screen_recording_file_path: ",
                          screen_recording_file_path)

                    source_path = settings.TEMP_FILES_ROOT+"/"+screen_file_name
                    if os.path.exists(source_path):
                        shutil.move(
                            source_path, screen_recording_file_path)

                    megadrive_record.screen_file = file_view.convert_file_path_to_link(
                        screen_recording_file_path)
                else:
                    msg = "Failed to save screen file"
                    print(msg)
                    #raise Exception(msg)

        except Exception as err:
            print("Error while handling screen file: " + str(err))

        # Process merged file
        try:
            merged_file_name = request['merged_webcam_screen_file']
            print("Merged File Name: ", merged_file_name)

            # set merged file youtube video link
            megadrive_record.merged_webcam_screen_file = merged_file_name
        except Exception as err:
            print("Error while handling merged file: " + str(err))

        # Get selected playlist
        if 'Account_info' in request.keys():
            Account_info = request['Account_info']
            Account_info = json.loads(Account_info)
            print("Account_info: ", Account_info)
            megadrive_record.Account_info = Account_info

        # Get an event id
        event_id = file_view.get_event_id()
        #event_id = "Testing"
        print("Dowell Event ID: ", event_id)
        megadrive_record.event_id = event_id

        # Save record in database
        # megadrive_record.save()
        # sync_to_async(megadrive_record.save())()
        """db_save_thread = threading.Thread(
            target=megadrive_record.save, args=())
        db_save_thread.start()"""
        # Dowell connection insertion of data
        insert_response = file_view.dowell_connection_db_insert(megadrive_record)

        mega_file_serializer = VpsFileSerializer(megadrive_record)
        #print("settings.BASE_DIR: ",settings.BASE_DIR)

        file_links = mega_file_serializer.data
        print("file_links: ", file_links)
        file_links_dict = {"file_links": file_links}
        return file_links_dict
    else:
        print("file_serializer.errors: ", file_serializer.errors)
        file_serializer_errors_dict = {
            "file_serializer_errors": file_serializer.errors}
        return file_serializer_errors_dict
