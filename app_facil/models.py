from django.db import models

# Create your models here.

class Sismo(models.Model):
    magnitud = models.FloatField()
    profundidad = models.FloatField()
    fecha = models.DateField()
    hora = models.TimeField()
    rango = models.FloatField()
    area = models.CharField(max_length=150)
    lugar = models.CharField(max_length=200)

    def __str__(self):
        # Esto es solo para que en el panel de administración se vea con un nombre amigable
        return f"Sismo de magnitud {self.magnitud} en {self.lugar}"
    
    
class Reporte(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    #Cada tipo de archivo va a su subcarpeta dentro de media/
    foto = models.ImageField(upload_to='reportes/fotos/')
    documento = models.FileField(upload_to='reportes/documentos', blank=True)
    audio = models.FileField(upload_to='reportes/audios/', blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    video = models.FileField(upload_to='reportes/videos', blank=True)
    def __str__(self):
        return self.nombre
    