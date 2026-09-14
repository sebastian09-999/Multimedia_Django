from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('',views.popayan),
    path('temblor/',views.formulario, name='temblor'),
    path('salida-temblor',views.salidaTemb, name='salida_temblor'),
    path('buscar-sismos/', views.buscar_sismos, name='buscar_sismos'),
    path('multimedia/', views.multimedia, name='multimedia'),
    path('evacuacion/', views.evacuacion, name='evacuacion'),
    path('panel/', views.panel_coderider, name='panel_coderider'),
]