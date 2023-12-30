import datetime
import json
import os
import shutil

import requests
from django.conf import settings
from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from . import youtube_api
from .models import VpsTestRecord
from .serializers import (
    VpsFileSerializer,
    VpsIncomingFileSerializer,
    VpsWebsocketFileSerializer,
)


load_dotenv()
permanent_files_dir = settings.PERMANENT_FILES_ROOT


class FileView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, *args, **kwargs):
        return
        file_serializer = VpsIncomingFileSerializer(data=request.data)

        if file_serializer.is_valid():
            megadrive_record = VpsTestRecord(
                user_name=request.data['userName'],
                test_description=request.data['testDescription'],
                test_name=request.data['testName'],
                user_files_timestamp=request.data['userFilesTimestamp'],
                app_type="UX_001"
            )

            try:
                webcam_file_name = request.data['webcamFile']
                # Process webcam file
                if 'https://youtu.be' in webcam_file_name:
                    megadrive_record.webcam_file = webcam_file_name
                else:
                    self.handle_recording_file(megadrive_record, webcam_file_name)

            except Exception as err:
                print("Error while handling webcam file:", err)

            # Similar processing for screen and merged files
            try:
                screen_file_name = request.data['screenFile']
                # Process screen file
                if 'https://youtu.be' in screen_file_name:
                    megadrive_record.screen_file = screen_file_name
                else:
                    self.handle_recording_file(megadrive_record, screen_file_name)

            except Exception as err:
                print("Error while handling screen file:", err)

            try:
                merged_file_name = request.data['mergedWebcamScreenFile']
                # Process merged file
                megadrive_record.merged_webcam_screen_file = merged_file_name

            except Exception as err:
                print("Error while handling merged file:", err)

            # Get selected playlist
            account_info = request.data.get('accountInfo')
            if account_info:
                megadrive_record.Account_info = json.loads(account_info)

            # Get an event id
            megadrive_record.event_id = self.get_event_id()

            # Dowell connection insertion of data
            insert_response = self.dowell_connection_db_insert(megadrive_record)

            mega_file_serializer = VpsFileSerializer(megadrive_record)
            file_links = mega_file_serializer.data

            return Response(file_links, status=status.HTTP_201_CREATED)
        else:
            print("file_serializer.errors:", file_serializer.errors)
            return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def handle_recording_file(self, megadrive_record, file_name):
            folder_created, new_path = self.create_recording_folder(
                megadrive_record.user_name, megadrive_record.user_files_timestamp)

            if folder_created:
                file_path = os.path.join(new_path, file_name)
                source_path = os.path.join(settings.TEMP_FILES_ROOT, file_name)

                if os.path.exists(source_path):
                    shutil.move(source_path, file_path)
                    megadrive_record.webcam_file = self.convert_file_path_to_link(file_path)
            else:
                msg = f"Failed to save {file_name.split('.')[0]} file"
                raise Exception(msg)

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

   

class BytesView(APIView):
    """
    A DRF APIView that receives a file as a byte stream and saves it to a file on the server.
    The file is expected to be sent in a multipart/form-data POST request with the 
    file data as the 'video_bytes' key and the file name as the 'fileName' key.
    """

    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        """
        Handles the POST request to save a file sent as a byte stream in a multipart/form-data POST request.
        The file is saved on the server with the file name extracted from the request.
            :param request: The HTTP request object.
            :param args: Additional positional arguments.
            :param kwargs: Additional keyword arguments.
            :return: A DRF Response object with a message indicating the bytes were received and an HTTP status code of 201.
        """

        # Extract the byte stream of the file from the request data.
        filedata = request.data['video_bytes']
        # Extract the file name from the request data.
        file_name = request.data['fileName']
        # Create the path where the file will be saved.
        recording_file_path = settings.MEDIA_ROOT + "/" + file_name

        # Open the file for writing in binary mode in append mode to ensure that data is added to the end of the file.
        with open(recording_file_path, 'ab+') as destination:
            for chunk in filedata.chunks():
                # Write each chunk of data to the file.
                destination.write(chunk)

        # Return a DRF Response object with a message indicating the bytes were received and an HTTP status code of 201.
        return Response("Bytes Received", status=status.HTTP_201_CREATED)


class CreateBroadcastView(APIView):
    # parser_classes = (MultiPartParser, FormParser)

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
    webcam_recording_file_path = ""
    screen_recording_file_path = ""
    merged_recording_file_path = ""

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
                    # raise Exception(msg)

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
        # event_id = "Testing"
        print("Dowell Event ID: ", event_id)
        megadrive_record.event_id = event_id

        # Save record in database
        """db_save_thread = threading.Thread(
            target=megadrive_record.save, args=())
        db_save_thread.start()"""
        # Dowell connection insertion of data
        insert_response = file_view.dowell_connection_db_insert(
            megadrive_record)

        mega_file_serializer = VpsFileSerializer(megadrive_record)
        # print("settings.BASE_DIR: ",settings.BASE_DIR)

        file_links = mega_file_serializer.data
        print("file_links: ", file_links)
        file_links_dict = {"file_links": file_links}
        return file_links_dict
    else:
        print("file_serializer.errors: ", file_serializer.errors)
        file_serializer_errors_dict = {
            "file_serializer_errors": file_serializer.errors}
        return file_serializer_errors_dict
