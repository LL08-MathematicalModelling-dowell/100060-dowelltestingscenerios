from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
import datetime
import logging
from youtube.models import PlaylistsRecord
from youtube.views import create_playlist

logs_files_dir = settings.LOGS_FILES_ROOT

# Create a logger for this file
#logger = logging.getLogger(__file__)
logger = logging.getLogger('playlists')


def create_playlist_dev(title_of_playlist):
    """
        Helps in testing playlist creation during development.
    """
    # print(title_of_playlist)
    new_playlist_data = {'kind': 'youtube#playlist', 'etag': 'kao78TffaXwNAVkvSVQ4k9rnYGg', 'id': 'PLtuQzcUOuJ4dBZPcmw1DaiiSHkqlDOtBJ', 'snippet': {'publishedAt': '2022-10-10T09:36:30Z', 'channelId': 'UCIdKn6oPpnjySBnpWgWcg5w', 'title': 'create playlist 15', 'description': '', 'thumbnails': {'default': {'url': 'https://i.ytimg.com/img/no_thumbnail.jpg', 'width': 120,
                                                                                                                                                                                                                                                                                                                 'height': 90}, 'medium': {'url': 'https://i.ytimg.com/img/no_thumbnail.jpg', 'width': 320, 'height': 180}, 'high': {'url': 'https://i.ytimg.com/img/no_thumbnail.jpg', 'width': 480, 'height': 360}}, 'channelTitle': 'Walter maina', 'defaultLanguage': 'en', 'localized': {'title': 'create playlist 15', 'description': ''}}, 'status': {'privacyStatus': 'private'}}
    return new_playlist_data


def get_playlist_title(time_offset):
    """
        Creates a new playlist title.
    """
    # Construct playlist title using date
    current_date_and_time = datetime.datetime.now(
    ) + datetime.timedelta(days=time_offset)

    date_string = current_date_and_time.strftime('%d %B %Y')
    #print("date_string: ",date_string)

    playlist_title = date_string + " Daily Playlist"
    #print("playlist_title: ",playlist_title)

    return playlist_title


def create_playlists():
    """
        Creates the number of playlists required.
    """
    try:
        OFFSET = 0 # Useful incase we need to resume creation, use 0 if there is no need to resume
        NEW_PLAYLISTS_NUMBER = 365  + OFFSET # Number of playlists to create
        #NEW_PLAYLISTS_NUMBER = 5  + OFFSET # Number of playlists to create

        # Create 365 playlists
        for playlist_number in range(NEW_PLAYLISTS_NUMBER):
            # print(playlist_number)
            new_playlist_title = get_playlist_title(playlist_number)
            #print("new_playlist_title: ", new_playlist_title)
            current_date_and_time = datetime.datetime.now()
            msg = current_date_and_time.strftime(
                "%Y-%m-%d, %H:%M:%S") + ": " + new_playlist_title + " " + str(playlist_number)
            # logger.debug(msg)

            # Playlist description
            playlist_description = "A playlist for videos created on " + \
                new_playlist_title.replace(" Daily Playlist", "")
            # print("playlist_description: ", playlist_description)

            # privacy
            playlist_privacy_status = "private"

            # Check if the new plalist title already exists
            queryset = PlaylistsRecord.objects.filter(
                playlist_title=new_playlist_title)
            if queryset.exists():
                print("Playlist exists: ", new_playlist_title)
            else:
                # create the playlist now
                #created_playlist_data = create_playlist_dev(new_playlist_title) # Development testing
                created_playlist_data = create_playlist(new_playlist_title, playlist_description, playlist_privacy_status)
                id = created_playlist_data["id"]
                print("New Playlist ID = ", id, end = ', ')
                title = created_playlist_data["snippet"]["title"]
                print("New Playlist Title = ", title)

                playlist_record = PlaylistsRecord()
                playlist_record.playlist_id = id
                playlist_record.playlist_title = title
                playlist_record.save()
                logger.debug(msg)

    except Exception as err:
        msg = "Error while creating a playlist: " + str(err)
        print(msg)


class Command(BaseCommand):
    help = 'Creates YouTube Playlists'

    def handle(self, *args, **kwargs):
        time = timezone.now().strftime('%X')
        self.stdout.write("Starting the creation of playlists %s" % time)
        create_playlists()
