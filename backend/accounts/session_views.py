from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def me(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({"authenticated": False})
    return JsonResponse(
        {
            "authenticated": True,
            "id": str(user.pk),
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    )