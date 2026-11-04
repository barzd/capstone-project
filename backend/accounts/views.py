import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

User = get_user_model()


def _body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return {}


@csrf_exempt
@require_POST
def register(request):
    data = _body(request)
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return JsonResponse({"error": "Username and password are required."}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already taken."}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    return JsonResponse({"id": str(user.pk), "username": user.username}, status=201)


@csrf_exempt
@require_POST
def login_view(request):
    data = _body(request)
    user = authenticate(
        request, username=data.get("username"), password=data.get("password")
    )
    if user is None:
        return JsonResponse({"error": "Invalid username or password."}, status=401)

    login(request, user)
    return JsonResponse({"id": str(user.pk), "username": user.username})


@csrf_exempt
@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})