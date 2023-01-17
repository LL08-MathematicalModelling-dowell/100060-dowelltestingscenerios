import re
from django import forms 
from .models import ChannelsRecord


class AddChannelRecord(forms.ModelForm):
    """
    Form description of ChannelRecord model of the youtube app.
    args:
        channel_id :     The youtube channel id in the form 'UCIdKn6oPpnjySBnpWgWcg5w'
        channel_title:   The youtube channel title, takes atleast 3 characters and at most 50 characters
        channel credential: The youtube credential, in Json or python-dictionary format
          Example
                {
                    "token": "ya29.ahl3NCAWQ_6icUq6Y3fo7DQe62R_Bjbqo7NBa9Kf0CB-7xJomCMMZJgT9g0163",
                    "refresh_token": "1//033c_jnX7RCjgCgYIARAAGAMSNwF-L9IrlfuF6CXn1I7q2oYqrzRtVxz0",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "client_id": "1012189436187-rjechkcof8lutbps8j0bfpkli0u.apps.googleusercontent.com",
                    "client_secret": "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Dsw",
                    "scopes": [
                        "https://www.googleapis.com/auth/youtube.force-ssl",
                        "openid",
                        "https://www.googleapis.com/auth/userinfo.profile",
                        "https://www.googleapis.com/auth/youtube.force-ssl",
                        "https://www.googleapis.com/auth/userinfo.email",
                        "https://www.googleapis.com/auth/youtube.readonly"
                    ]
               }
    """
    channel_id = forms.CharField(widget=forms.TextInput(attrs={'class':'form-control', 'id':'channel_id_modal'}))
    channel_title = forms.CharField(widget=forms.TextInput(attrs={'class':'form-control', 'id':'channel_title_modal'}))
    channel_credentials = forms.CharField(widget=forms.Textarea(attrs={'class':'form-control', 'id':'channel_credentials_modal', 'rows': '10'}))

    # def clean_channel_id(self):
    #     """
    #     A validator method to validate channel id 
    #     """
    #     channel_id = self.cleaned_data.get('channel_id')
    #     if not re.match(r'^UC[a-zA-Z0-9-_]{22}$', channel_id):
    #         raise forms.ValidationError('wrong id format')
    #     return channel_id
    
    # def clean_channel_tile(self):
    #     """
    #     A validator method to validate channel title 
    #     """
    #     channel_title = self.cleaned_data.get('channel_title')    
    #     if not re.match('^[a-zA-Z0-9._-]{3,50}$', channel_title):
    #         raise forms.ValidationError('title should be atleast 3 and atmost 50 characters')
    #     return channel_title

    class Meta:
        """
        Overriden Meta class to define model class and form field 
        """
        model = ChannelsRecord
        fields = ['channel_id', 'channel_title', 'channel_credentials']

