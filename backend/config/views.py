from django.conf import settings
from django.http import HttpResponseBadRequest, HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_GET
def inventory_return(request):
    origin = request.GET.get("origin", "").rstrip("/")
    allowed_origins = {
        allowed_origin.rstrip("/")
        for allowed_origin in getattr(settings, "CORS_ALLOWED_ORIGINS", [])
    }

    if origin not in allowed_origins:
        return HttpResponseBadRequest("Invalid inventory return origin.")

    return HttpResponseRedirect(f"{origin}/?admin_inventory=1")
