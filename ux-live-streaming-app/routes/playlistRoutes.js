const express = require('express');

const router = express.Router();
const playlistService = require('../src/services/youtubeService');

// Ensure you have session management set up correctly to use req.session

// Route to fetch user playlists
router.get('/playlists', async (req, res) => {
  if (!req.session.user || !req.session.user.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { accessToken } = req.session.user;
    const playlists = await playlistService.fetchUserPlaylists(accessToken);
    return res.json(playlists);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Route to create a new playlist
router.post('/playlists', async (req, res) => {
  if (!req.session.user || !req.session.user.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const { accessToken } = req.session.user;
    const playlist = await playlistService.createPlaylist(accessToken, title, description);
    return res.status(201).json(playlist);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Route to fetch all user playlists (paginated)
router.get('/playlists/all', async (req, res) => {
  if (!req.session.user || !req.session.user.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { accessToken } = req.session.user;
    const allPlaylists = await playlistService.fetchAllUserPlaylists(accessToken);
    return res.json(allPlaylists);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch all playlists' });
  }
});

module.exports = router;
