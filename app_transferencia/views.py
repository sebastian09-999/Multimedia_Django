from django.shortcuts import render


def fn_getpost_rider(request):
  resultado = ''
  dato = None
  metodo = request.method

  if request.method == 'GET':
    dato = request.GET.get('dato')
    if dato:
      resultado = 'El dato llegó mediante GET'

  elif request.method == 'POST':
    dato = request.POST.get('dato')  # Corregido: asignación correcta
    if dato:
      resultado = 'El dato llegó mediante POST'

  return render(
      request,
      'app_transferencia/transferencias.html',
      {
          'resultado': resultado,
          'dato': dato,
          'metodo': metodo,
      },
  )