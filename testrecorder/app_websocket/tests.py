import gi
import subprocess
from gi.repository import Gst, GObject

class GStreamerProcessManager:
    """ Manages the GStreamer process """

    def __init__(self, send=None):
        self.pipeline = None
        self.rtmp_url = None
        self.audio_enabled = False
        self.appsrc = None  # Added appsrc element to handle incoming video data

    def handle_browser_sound(self, text_data):
        """Handle the browser sound message"""
        self.audio_enabled = True
        self.rtmp_url = self.extract_rtmp_url(text_data)
        self.start_gstreamer_pipeline()

        return self.rtmp_url

    def handle_rtmp_url(self, data):
        """Handle the rtmp url message"""
        self.audio_enabled = False
        self.rtmp_url = data.strip()
        self.start_gstreamer_pipeline()

        return self.rtmp_url

    def end_broadcast(self, scope):
        """Ends the broadcast"""
        success = self.transition_broadcast(scope=scope)
        return success

    def handle_bytes_data(self, bytes_data):
        """Handle the bytes data message"""
        if self.appsrc:
            # Push incoming video data to appsrc
            buf = Gst.Buffer.new_wrapped(bytes_data)
            self.appsrc.emit("push-buffer", buf)

    def cleanup_on_disconnect(self, scope):
        """Cleanup when the websocket disconnects"""
        if self.pipeline:
            self.gstreamer_process_cleanup(scope)

    def transition_broadcast(self, scope):
        """Transition the broadcast"""
        success = False
        if self.pipeline:
            try:
                stream_dict = cache.get(
                    f"stream_dict{scope.get('user').id}", None)
                if stream_dict:
                    broadcast_status = 'complete'
                    trans_dict = transition_broadcast(
                        stream_dict.get('new_broadcast_id'),
                        broadcast_status,
                        scope=scope
                    )
                    if "error" not in trans_dict:
                        success = True
                    else:
                        print(f"Failed to transition broadcast {trans_dict}")
            except Exception as err:
                print("Failed to transition broadcast:", err)

        return success

    def gstreamer_process_cleanup(self, scope):
        """Cleanup the GStreamer process manager"""
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
            self.transition_broadcast(scope=scope)
        self.pipeline = None

    def start_gstreamer_pipeline(self):
        try:
            # Create GStreamer pipeline
            self.pipeline = Gst.Pipeline()

            # Add elements to the pipeline
            self.appsrc = Gst.ElementFactory.make("appsrc", "app-source")
            decodebin = Gst.ElementFactory.make("decodebin", "decoder")
            x264enc = Gst.ElementFactory.make("x264enc", "video-encoder")
            flvmux = Gst.ElementFactory.make("flvmux", "flv-muxer")
            rtmpsink = Gst.ElementFactory.make("rtmpsink", "rtmp-sink")

            # Check if elements were created successfully
            if not self.appsrc or not decodebin or not x264enc or not flvmux or not rtmpsink:
                print("Not all elements could be created")
                self.gstreamer_process_cleanup(scope)
                return

            # Set properties for elements
            rtmpsink.set_property("location", self.rtmp_url)

            # Add elements to the pipeline
            self.pipeline.add(self.appsrc)
            self.pipeline.add(decodebin)
            self.pipeline.add(x264enc)
            self.pipeline.add(flvmux)
            self.pipeline.add(rtmpsink)

            # Link elements in the pipeline
            self.appsrc.link(decodebin)
            decodebin.link(x264enc)
            x264enc.link(flvmux)
            flvmux.link(rtmpsink)

            # Set the pipeline state to playing
            self.pipeline.set_state(Gst.State.PLAYING)

        except Exception as e:
            print("Error starting GStreamer pipeline:", e)
            self.gstreamer_process_cleanup(scope)

    def extract_rtmp_url(self, data):
        """Extract the rtmp url from the data"""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()
