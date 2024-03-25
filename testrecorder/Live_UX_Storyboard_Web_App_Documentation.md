# Introduction

This document describes how the live ux storyboard web application
functions; the URL for the application is
<https://liveuxstoryboard.com/>. The application helps to record user
activities using:

1.  Their webcam.

2.  Their Screen.

3.  Their Microphone.

Some of the files are saved in YouTube and others on our interserver
VPS.

# Problem Statement

The main objective was to develop a web application that could be used
by someone to record their activities on their computer. Initially the
user was a tester testing an application; such a recording would have
been useful for the developer in debugging or as proof that the
application is functioning as expected. Another use for the application
was found, which is to record team meetings for future reference in case
somebody wanted to access what was discussed in the meeting again.

3.  # Project Requirements

    1.  The user shall be able to make the following settings:

        1.  To record the webcam or not.

        2.  To record screen or not.

        3.  To record audio or not.

        4.  To upload key logging files or not; beanote and selenium ide
            files.

        5.  To make a YouTube recording of the video private or public.

        6.  To fetch and store clickup task notes or not.

    2.  The application shall have the following buttons:

        1.  Start recording button.

        2.  Save/Stop recording button.

        3.  View YouTube recording file button.

        4.  View files of the current recording button.

        5.  User settings button

    3.  The software shall store the YouTube videos in a selected
        YouTube account channel, whose authentication is done in the
        backend without involving the user.

    4.  The software shall store some files of a recording in our
        interserver VPS.

    5.  The software shall fetch and store clickup task notes, if
        requested to do so.

4.  # Application Architecture

The following diagram is the application architecture that was followed:

<img src="media/image1.png" style="width:6.5in;height:3.43056in" alt="Live UX Storyboard Web App Architecture.png" />

**Figure 4.1:** Live UX Storyboard Application Architecture

5.  # Application Pseudocode

    1.  The live ux storyboard home page loads on user’s browser.

    2.  The user makes changes to the settings part of the live ux
        storyboard home page to suit their current recording need.

    3.  User clicks on the start recording button.

    4.  A modal appears, requesting the user to enter their user name,
        test name and test description details.

    5.  The test details are validated.

    6.  If the test details are valid, media recorders are created.

    7.  Websockets for the YouTube, webcam and screen files are created
        depending on user settings.

    8.  On creation of webcam and screen websocket, file names are sent
        to these sockets, the file names will be used to create files to
        store streamed webcam or screen data.

    9.  YouTube broadcast is created.

    10. If broadcast was successfully created, a RTMP URL is created and
        sent to the YouTube websocket.

    11. If a reply to the front end part of the YouTube websocket that
        the RTMP URL was received by the backend part of the YouTube
        websocket is received, the media recorders are started so that
        the data can start streaming to their respective websockets.

    12. Each media recorder sends data to its respective websocket
        whenever data is available.

    13. Data continues to stream in to the YouTube channel or files on
        the interserver VPS.

    14. When user has recorded enough, he or she presses the Save/Stop
        recording button.

    15. All streams are stopped.

    16. A Check is done to see if there is a need to get a clickup task
        id from the user.

    17. A check is done to check if there is a need to get beanote and
        selenium ide files from the user.

    18. All websockets are closed.

    19. YouTube broadcast is transitioned to a complete state (broadcast
        is ended).

    20. A data structure containing recording data such as user name,
        test name, test description, YouTube video url, webcam video
        url, screen video url and clickup task ids is created.

    21. The data is sent to the backend for storage.

    22. If all went well the user receives a notification that the data
        upload is complete.

    23. The recording enters a complete state.

6.  # Application APIs

The following APIs are available in the live ux storyboard application:

1.  <https://liveuxstoryboard.com/youtube/createbroadcast/api/> - is
    used to create a YouTube broadcast.

2.  <https://liveuxstoryboard.com/youtube/transitionbroadcast/api/> - is
    used to end the broadcast.

3.  <https://liveuxstoryboard.com/file/upload/> - is used to save the
    recording data in a database.

4.  <https://liveuxstoryboard.com/youtube/fetchplaylists/api/> - is used
    to fetch user’s YouTube playlist.

5.  <https://liveuxstoryboard.com/youtube/channels/api/> - is used to
    fetch user’s YouTube channel.

6.  wss://liveuxstoryboard.com/ws/app/ - is used to create the websocket
    that is used to send video data to a YouTube channel.

References

1.  <https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps#python>

2.  <https://dev.to/antopiras89/using-the-mediastream-web-api-to-record-screen-camera-and-audio-1c4n>
