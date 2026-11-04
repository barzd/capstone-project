import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
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
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not (first_name and last_name and username and email and password):
        return JsonResponse(
            {"error": "First name, last name, username, email and password are required."},
            status=400,
        )
    if len(first_name) > 150 or len(last_name) > 150:
        return JsonResponse({"error": "Names must be 150 characters or fewer."}, status=400)
    if "@" in username:
        return JsonResponse({"error": "Username can't contain @."}, status=400)
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"error": "Enter a valid email address."}, status=400)
    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({"error": "Username already taken."}, status=400)
    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"error": "Email already registered."}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    return JsonResponse(
        {
            "id": str(user.pk),
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
        status=201,
    )


@csrf_exempt
@require_POST
def login_view(request):
    data = _body(request)
    identifier = (data.get("username") or "").strip()
    password = data.get("password") or ""

    username = identifier
    if "@" in identifier:
        match = User.objects.filter(email__iexact=identifier).first()
        username = match.username if match else None

    user = (
        authenticate(request, username=username, password=password)
        if username
        else None
    )
    if user is None:
        return JsonResponse({"error": "Invalid username or password."}, status=401)

    login(request, user)
    return JsonResponse(
        {
            "id": str(user.pk),
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    )


@csrf_exempt
@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})