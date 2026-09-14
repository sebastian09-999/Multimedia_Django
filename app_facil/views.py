from django.shortcuts import render, redirect
from .models import Sismo
from .models import Reporte
from .forms import ReporteForm

# Create your views here.

def popayan(request):
    return render(request, 'popayan.html')

def formulario(request):
    return render(request, 'temblor.html')

def salidaTemb(request):
    # Variable donde guardaremos los sismos que se van a mostrar en la tabla
    sismos_a_mostrar = [] 

    if request.method == 'POST':
        # 1. Capturamos los datos del formulario
        mag = request.POST.get('magnitud')
        prof = request.POST.get('profundidad')
        fec = request.POST.get('fecha')
        hor = request.POST.get('hora')
        ran = request.POST.get('rango')
        are = request.POST.get('area')
        lug = request.POST.get('lugar')

        # 2. Creamos y guardamos el nuevo registro
        nuevo_sismo = Sismo(
            magnitud=mag,
            profundidad=prof,
            fecha=fec,
            hora=hor,
            rango=ran,
            area=are,
            lugar=lug
        )
        nuevo_sismo.save()
        
        # 3. Identificamos qué botón se presionó usando el atributo 'name="accion"'
        accion = request.POST.get('accion')
        
        if accion == 'ver_unico':
            # Si quiere ver solo el que acaba de registrar, lo metemos en una lista
            # para que el ciclo {% for %} de tu HTML siga funcionando perfectamente
            sismos_a_mostrar = [nuevo_sismo]
            
        elif accion == 'ver_todos':
            # Si quiere ver todos, traemos toda la base de datos
            sismos_a_mostrar = Sismo.objects.all().order_by('-id')
            
    else:
        # Si alguien recarga la página o entra por URL (por método GET), 
        # por defecto le mostramos todos los registros
        sismos_a_mostrar = Sismo.objects.all().order_by('-id')

    # 4. Enviamos la información final a la plantilla
    return render(request, 'app_facil/salidaTemblor.html', {'sismos': sismos_a_mostrar})




def buscar_sismos(request):
    criterio = request.GET.get('criterio')
    valor = request.GET.get('valor')
    
    # Partimos de todos los sismos
    sismos = Sismo.objects.all()
    
    # Aplicamos el filtro dependiendo de lo que el usuario seleccionó en la lista desplegable
    if criterio and valor:
        if criterio == 'lugar':
            sismos = sismos.filter(lugar__icontains=valor)
        elif criterio == 'area':
            sismos = sismos.filter(area__icontains=valor)
        elif criterio == 'magnitud':
            sismos = sismos.filter(magnitud=valor)
        elif criterio == 'profundidad':
            sismos = sismos.filter(profundidad=valor)
        elif criterio == 'fecha':
            sismos = sismos.filter(fecha=valor)
        elif criterio == 'hora':
            sismos = sismos.filter(hora=valor)
        elif criterio == 'rango':
            sismos = sismos.filter(rango=valor)
            
    # Ordenamos del más reciente al más antiguo
    sismos = sismos.order_by('-id')
    
    return render(request, 'app_facil/salidaTemblor.html', {'sismos': sismos})

def multimedia(request):
    return render(request,'multimedia.html')

#GET POST   
def evacuacion(request):
    if request.method == 'POST':
        form = ReporteForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('evacuacion')  # Redirige a la misma página después de guardar
    else:
        form = ReporteForm()
    reportes = Reporte.objects.all()
    return render(request, 'app_facil/evacuacion.html',{
        'form':form,
        'reportes':reportes,
    })
    
    
def panel_coderider(request):
    return render(request, 'app_facil/panel.html')