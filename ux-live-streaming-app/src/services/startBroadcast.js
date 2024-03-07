const { google } = require('googleapis');
const { getOAuth2Client } = require('./oauthClient');

// Utility function to format date to ISO string
function getFutureDateISO(seconds) {
  const futureDate = new Date(new Date().getTime() + seconds * 1000);
  return futureDate.toISOString();
}

async function insertBroadcast(videoPrivacyStatus, videoTitle, youtube) {
  const futureDateISO = getFutureDateISO(1); // 1 second from now
  const finalVideoTitle = `${videoTitle} ${futureDateISO}`;

  try {
    const response = await youtube.liveBroadcasts.insert({
      part: 'snippet,contentDetails,status',
      requestBody: {
        status: {
          privacyStatus: videoPrivacyStatus,
          selfDeclaredMadeForKids: false,
        },
        snippet: {
          scheduledStartTime: futureDateISO,
          title: finalVideoTitle,
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
          closedCaptionsType: 'closedCaptionsEmbedded',
        },
      },
    });
    console.log('Broadcast created:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('Error creating broadcast:', error);
    throw error;
  }
}

async function insertStream(youtube) {
  try {
    const response = await youtube.liveStreams.insert({
      part: 'snippet,cdn',
      requestBody: {
        cdn: {
          frameRate: 'variable',
          ingestionType: 'rtmp',
          resolution: 'variable',
        },
        snippet: {
          title: 'A non-reusable stream',
          description: 'A stream to be used once.',
        },
      },
    });

    const { id: newStreamId, cdn } = response.data;
    const newStreamName = cdn.ingestionInfo.streamName;
    const newStreamIngestionAddress = cdn.ingestionInfo.ingestionAddress;
    const newRtmpUrl = `${newStreamIngestionAddress}/${newStreamName}`;

    console.log('Stream created:', response.data);
    return {
      newStreamId,
      newStreamName,
      newStreamIngestionAddress,
      newRtmpUrl,
    };
  } catch (error) {
    console.error('Error creating stream:', error);
    throw error;
  }
}

async function bindBroadcast(broadcastId, streamId, youtube) {
  try {
    const response = await youtube.liveBroadcasts.bind({
      part: 'id,contentDetails',
      id: broadcastId,
      streamId,
    });
    console.log('Broadcast bound to stream:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error binding broadcast:', error);
    throw error;
  }
}

async function insertStreamIntoPlaylist(accessToken, playlistId, videoId) {
  const oauth2Client = getOAuth2Client(accessToken);
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    const response = await youtube.playlistItems.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId,
          },
        },
      },
    });
    console.log('Stream inserted into playlist:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error inserting stream into playlist:', error);
    throw error;
  }
}

async function createBroadcast(videoPrivacyStatus, videoTitle, youtube) {
  try {
    // Create a new broadcast
    const newBroadcastId = await insertBroadcast(
      videoPrivacyStatus,
      videoTitle,
      youtube,
    );

    // Create a new stream
    const streamInfo = await insertStream(youtube);

    // Bind the stream to the broadcast
    await bindBroadcast(newBroadcastId, streamInfo.newStreamId, youtube);

    // Adding the new broadcast id to the stream info
    streamInfo.newBroadcastId = newBroadcastId;

    return streamInfo;
  } catch (error) {
    console.error('Error in createBroadcast:', error);
    return { error: error.message };
  }
}

async function startBroadcast(accessToken, videoPrivacyStatus, videoTitle, playlistId) {
  try {
    const oauth2Client = getOAuth2Client(accessToken);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    if (!youtube) {
      return { error: 'YouTube API not initialized' };
    }

    // Create a new broadcast with stream and bind them
    const streamInfo = await createBroadcast(videoPrivacyStatus, videoTitle, youtube);

    if (streamInfo.error) {
      return streamInfo;
    }

    // Optional: Insert the broadcast into a playlist
    if (playlistId) {
      const videoId = streamInfo.newBroadcastId;
      const playlistInsertResponse = await insertStreamIntoPlaylist(
        accessToken,
        playlistId,
        videoId,
      );

      if (playlistInsertResponse.error) {
        return { error: playlistInsertResponse.error };
      }
    }
    console.log(`XXXXXXXXXXXXXXXXXXXXX  ${streamInfo} XXXXXXXXXXXXXXXXXXXXXXX`);

    return streamInfo;
  } catch (error) {
    console.error('Error in startBroadcast:', error);
    return { error: error.message };
  }
}

async function transitionBroadcast(accessToken, broadcastId, status) {
  const oauth2Client = getOAuth2Client(accessToken);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    const response = await youtube.liveBroadcasts.transition({
      part: 'id,status',
      broadcastStatus: status,
      id: broadcastId,
    });

    if (response.data.status.lifeCycleStatus === 'complete') {
      console.log('Broadcast transitioned:', response.data);
      return response.data;
    }
    console.error('Broadcast transition error:', response.data);
    return { error: response.data };
  } catch (error) {
    console.error('Error transitioning broadcast:', error);
    throw error;
  }
}

module.exports = {
  startBroadcast,
  transitionBroadcast,
};
