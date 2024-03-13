const { google } = require('googleapis');
const { getOAuth2Client } = require('./oauthClient');

async function createLiveBroadcast(accessToken, title, description, scheduledStartTime) {
  const oauth2Client = getOAuth2Client(accessToken);
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    const response = await youtube.liveBroadcasts.insert({
      part: 'snippet,contentDetails,status',
      requestBody: {
        snippet: {
          title,
          description,
          scheduledStartTime, // ISO 8601 format
        },
        status: {
          privacyStatus: 'private',
        },
        contentDetails: {
          monitorStream: {
            enableMonitorStream: true,
          },
        },
      },
    });
    console.log('Live broadcast created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating live broadcast:', error);
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

const getChannelByUsername = async (accessToken, username) => {
  const oauth2Client = getOAuth2Client(accessToken);
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    const response = await youtube.channels.list({
      part: 'snippet,contentDetails,statistics',
      forUsername: username,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching channel information:', error);
    throw error;
  }
};

const listLiveBroadcasts = async (accessToken) => {
  const oauth2Client = getOAuth2Client(accessToken);
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    const response = await youtube.liveBroadcasts.list({
      part: 'snippet,contentDetails,status',
      broadcastStatus: 'active',
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching live broadcasts:', error);
    throw error;
  }
};
async function fetchUserPlaylists(accessToken, pageToken = null) {
  const oauth2Client = getOAuth2Client(accessToken);
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    const response = await youtube.playlists.list({
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 25,
      pageToken, // Use the pageToken for pagination
    });

    // Extract only the ID and name from each playlist
    const playlists = response.data.items.map((item) => ({
      id: item.id,
      name: item.snippet.title,
    }));

    return { playlists, nextPageToken: response.data.nextPageToken };
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
}

async function createPlaylist(accessToken, title, description = '') {
  const oauth2Client = getOAuth2Client(accessToken);
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  try {
    const response = await youtube.playlists.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: 'private', // or 'public' or 'unlisted'
        },
      },
    });
    console.log('Playlist created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

async function fetchAllUserPlaylists(accessToken) {
  async function fetchUserPlaylistsRecursive(nextPageToken, accumulatedPlaylists = []) {
    const {
      playlists,
      nextPageToken: newNextPageToken,
    } = await fetchUserPlaylists(accessToken, nextPageToken);

    const updatedPlaylists = accumulatedPlaylists.concat(playlists);

    if (newNextPageToken) {
      return fetchUserPlaylistsRecursive(newNextPageToken, updatedPlaylists);
    }

    return updatedPlaylists;
  }

  return fetchUserPlaylistsRecursive(null);
}

module.exports = {
  getChannelByUsername,
  listLiveBroadcasts,
  fetchUserPlaylists,
  createPlaylist,
  createLiveBroadcast,
  insertStreamIntoPlaylist,
  fetchAllUserPlaylists,
};
