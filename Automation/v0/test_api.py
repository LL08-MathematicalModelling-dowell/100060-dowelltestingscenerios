import unittest
from flask import Flask
from app import app, socketio

class TestFlaskAPI(unittest.TestCase):


    def setUp(self):
        # Create a test client for the Flask app
        self.app = app.test_client()
        self.app.testing = True

    def test_index_endpoint(self):
        # Test the index endpoint
        response = self.app.get('/')
        self.assertEqual(response.status_code, 302)  # Redirect to root URL, as user is not logged in

    def test_channel_endpoint(self):
        # Test the channel endpoint
        response = self.app.get('/channel')
        self.assertEqual(response.status_code, 302)  # Redirect to root URL, as user is not logged in

    def test_playlists_endpoint(self):
        # Test the playlists endpoint
        response = self.app.get('/playlists')
        self.assertEqual(response.status_code, 302)  # Redirect to root URL, as user is not logged in

    def test_create_playlist_endpoint(self):
        # Test the createPlaylist endpoint
        data = {
            'title': 'Test Playlist',
            'description': 'Test Description'
        }
        response = self.app.post('/createPlaylist', data=data)
        self.assertEqual(response.status_code, 302)  # Redirect to root URL, as user is not logged in

    def test_start_live_stream_endpoint(self):
        # Test the startLiveStream endpoint
        response = self.app.post('/startLiveStream')
        self.assertEqual(response.status_code, 302)  # Redirect to root URL, as user is not logged in

    def test_socketio_connect(self):
        # Test Socket.IO connection
        socketio_test_client = socketio.test_client(app)
        self.assertTrue(socketio_test_client.is_connected())

    def test_socketio_disconnect(self):
        # Test Socket.IO disconnection
        socketio_test_client = socketio.test_client(app)
        socketio_test_client.disconnect()
        self.assertFalse(socketio_test_client.is_connected())

    def test_socketio_start_stream_event(self):
        # Test Socket.IO event for starting a stream
        socketio_test_client = socketio.test_client(app)
        response = socketio_test_client.get_received()
        self.assertEqual(len(response), 0)  # No events yet
        socketio_test_client.emit('start_stream',  'test_stream')
        response = socketio_test_client.get_received()
        self.assertEqual(len(response), 2)  # One event received
        self.assertEqual(response[0]['name'], 'stream_started')  # Check event name

        def test_socketio_stop_stream_event(self):
        # Test Socket.IO event for stopping a stream
            socketio_test_client = socketio.test_client(app)
            response = socketio_test_client.get_received()
            self.assertEqual(len(response), 0)  # No events yet
            socketio_test_client.emit('stop_stream', {'stream_id': 'test_stream_id'})
            response = socketio_test_client.get_received()
            self.assertEqual(len(response), 1)  # One event received
            self.assertEqual(response[0]['name'], 'stream_stopped') 
    
if __name__ == '__main__':
    unittest.main()
