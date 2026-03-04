from django.shortcuts import render

def regist(request):
    return render(request, "regist.html")
def index(request):
    return render(request, "index.html")
def auth(request):
    return render(request, "auth.html")
def person(request):
    return render(request, "person.html")