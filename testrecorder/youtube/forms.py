import re
from django import forms
# from django_select2.forms import ModelSelect2Widget
from .models import ChannelsRecord, PlaylistsRecord


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
    # channel_credentials = forms.CharField(widget=forms.Textarea(attrs={'class':'form-control', 'id':'channel_credentials_modal', 'rows': '5'}))

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
    PUBLIC = 'Public'
    PRIVACY_STATUS = [
        (PRIVATE, 'private'),
        (PUBLIC, 'public')
    ]

    playlist_title = forms.CharField(widget=forms.TextInput(
        attrs={'class': 'form-control',
               'id': 'playlist_title_modal',
               'placeholder': 'Enter Playlist Title'
               }
    ))
    channel = forms.ModelChoiceField(
        queryset=ChannelsRecord.objects.all(),
        widget=forms.Select(attrs={
            'class': 'form-control select2 select2-hidden-accessible',
            'id': 'playlist_channel_modal',
            'style': 'width: 100%;',
        }),
        to_field_name='channel_title',
    )
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
    # privacy_status = forms.ChoiceField(
    #     choices=PRIVACY_STATUS,
    #     widget=forms.Select(attrs={
    #         'class':'form-control',
    #         'id':'playlist_privacy_status_modal',
    #         'style':'width:100px;'
    #     }),
    #     initial=PUBLIC,
    # )
