from django.urls import path
from .views import HomePageView,records_view


urlpatterns = [
    path('', HomePageView.as_view(), name='home'),
    path('recordings/', records_view, name='view_records')
]