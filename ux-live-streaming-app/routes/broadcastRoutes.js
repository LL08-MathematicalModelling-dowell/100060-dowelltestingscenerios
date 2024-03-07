const bodyParser = require('body-parser');
const { startBroadcast } = require('./yourModule');

app.use(bodyParser.json());

app.post('/startBroadcast', async (req, res) => {
  const {
    accessToken, videoPrivacyStatus, testNameValue, playlistId,
  } = req.body;

  // Ensure all required fields are provided
  if (!accessToken || !videoPrivacyStatus || !testNameValue) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Start the broadcast
    const result = await startBroadcast(accessToken, videoPrivacyStatus, testNameValue, playlistId);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Respond back with the result
    res.json(result);
  } catch (error) {
    console.error('Error starting broadcast:', error);
    res.status(500).json({ error: 'Failed to start broadcast' });
  }
});
