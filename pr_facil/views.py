from django.shortcuts import render

def fn_inicio(request):
    return render(request, 'index.html')