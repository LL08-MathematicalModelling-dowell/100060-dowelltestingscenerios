from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    # api_key = models.CharField(max_length=40, unique=True, blank=True, null=True)
    
    # def __str__(self):
    #     return self.username
    pass