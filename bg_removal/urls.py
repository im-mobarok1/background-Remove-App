from django.urls import path
from . import views

urlpatterns = [
    path('', views.bg_remove_tool, name='bg_remove_tool'),
    path('upload/', views.upload_image, name='upload_image'),
]