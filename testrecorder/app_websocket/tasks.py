from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def flush_buffer_to_youtube(stream_id, buffer_data):
    """Sends buffered data to a YouTube live broadcast using the YouTube Data API v3.

    Args:
        stream_id: The ID of the YouTube live broadcast.
        buffer_data: The buffered data to send to the broadcast.
    """

    youtube = build('youtube', 'v3', developerKey='YOUR_API_KEY')  # Replace with your API key

    try:
        insert_request = youtube.liveBroadcasts().insert(
            part='snippet,cdn',
            body={
                'snippet': {
                    'title': 'Buffered Data from Stream'  # Set a descriptive title
                },
                'cdn': {
                    'ingestionType': 'rtmp',
                    'ingestionInfo': {
                        'streamName': stream_id  # Use the existing stream ID
                    }
                }
            },
            media_body=buffer_data  # Send buffered data as media
        )
        response = insert_request.execute()

        print(f"Buffered data sent to YouTube broadcast: {response['id']}")

    except HttpError as error:
        print("Error sending buffered data to YouTube:", error)

