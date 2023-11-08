from django import forms
from .models import ChannelsRecord


class AddChannelRecord(forms.ModelForm):
    """
    Form description of ChannelRecord model of the youtube app.
    args:
        channel_id :     The youtube channel id in the form 'UCIdKn6oPpnjySBnpWgWcg5w'
        channel_title:   The youtube channel title, takes atleast 3 characters and at most 50 characters
    """
    channel_id = forms.CharField(widget=forms.TextInput(
        attrs={'class': 'form-control', 'id': 'channel_id_modal', 'placeholder': 'Enter Channel ID'}))
    channel_title = forms.CharField(widget=forms.TextInput(
        attrs={'class': 'form-control', 'id': 'channel_title_modal', 'placeholder': 'Enter Channel Title'}))

    class Meta:
        """
        Overriden Meta class to define model class and form field 
        """
        model = ChannelsRecord
        fields = ['channel_id', 'channel_title']  # , 'channel_credentials']


class CreatePlaylist(forms.Form):
    """
    Form that Handles Playlist creation
    args:
        playlist_title(str): Playlist title
        channel: A coresponding channel for the playlist. a dropdown for ha list all available channels
        playlist_description: Description for he playlist
        privacy_status: Two options, 'private/public'. sets the privacy status of the playlist
    """
    PRIVATE = 'private'
    UNLISTED = 'unlisted'
    PUBLIC = 'Public'
    PRIVACY_STATUS = [
        (PRIVATE, 'private'),
        (UNLISTED, 'unlisted'),
        (PUBLIC, 'public')
    ]

    playlist_title = forms.CharField(widget=forms.TextInput(
        attrs={'class': 'form-control',
               'id': 'playlist_title_modal',
               'placeholder': 'Enter playlist Name'
               }
    ))
    channel = forms.ChoiceField(choices=[], widget=forms.Select(
        attrs={
            'class': 'form-control select2 select2-hidden-accessible',
            'id': 'playlist_channel_modal',
            'style': 'width: 100%;',
        }
    ))
    playlist_description = forms.CharField(widget=forms.Textarea(
        attrs={
            'class': 'form-control',
            'id': 'playlist_description_modal', 'rows': '3'}))
    privacy_status = forms.ChoiceField(
        choices=PRIVACY_STATUS,
        widget=forms.RadioSelect(attrs={
            'class': 'form-check-input',
            'id': 'playlist_privacy_status_modal',
        }),
        initial=PUBLIC,
    )
