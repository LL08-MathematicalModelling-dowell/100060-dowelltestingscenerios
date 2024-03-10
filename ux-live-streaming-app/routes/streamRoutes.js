const express = require('express');

const router = express.Router();
const streamController = require('../src/controllers/streamControllers');
const youtubeService = require('../src/services/youtubeService');
const { ensureAuthenticated } = require('../src/middleware/auth');

router.get('/protected-route', ensureAuthenticated, (req, res) => {
  res.json({ message: 'You have accessed a protected route' });
});

router.get('/channel/:username', async (req, res) => {
  try {
    const channelInfo = await youtubeService.getChannelByUsername(req.params.username);
    res.json(channelInfo);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to start a stream
router.post('/start', async (req, res) => {
  const { userId } = req.body; // Assume userId is passed in the request body
  try {
    const response = await streamController.startStream(userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start stream.' });
  }
});

// Route to stop a stream
router.post('/stop', async (req, res) => {
  const { streamId } = req.body; // Assume streamId is passed in the request body
  try {
    const response = await streamController.stopStream(streamId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to stop stream.' });
  }
});

// Export the router
module.exports = router;
