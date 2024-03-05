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
      pageToken, // Pagination: Set pageToken to fetch next page
    });
    console.log(response.data);
    return response.data;
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
  let playlists = [];
  let nextPageToken = null;
  do {
    const response = await fetchUserPlaylists(accessToken, nextPageToken);
    playlists = playlists.concat(response.items);
    nextPageToken = response.nextPageToken;
  } while (nextPageToken);
  return playlists;
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
