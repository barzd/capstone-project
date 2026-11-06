import json
import logging
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage, get_connection
from django.http import JsonResponse
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

User = get_user_model()
logger = logging.getLogger(__name__)

GENERIC_MESSAGE = "If that email is registered, a reset link has been sent."


def _body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return {}


def _frontend_url():
    explicit = os.environ.get("FRONTEND_URL")
    if explicit:
        return explicit.rstrip("/")
    codespace = os.environ.get("CODESPACE_NAME")
    if codespace:
        domain = os.environ.get(
            "GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev"
        )
        port = os.environ.get("FRONTEND_PORT", "5173")
        return f"https://{codespace}-{port}.{domain}"
    # The app must be opened on 127.0.0.1 so login cookies are shared.
    return "http://127.0.0.1:5173"


def _connection():
    return get_connection(
        backend="django.core.mail.backends.smtp.EmailBackend",
        host=os.environ["EMAIL_HOST"],
        port=int(os.environ.get("EMAIL_PORT", "587")),
        username=os.environ.get("EMAIL_HOST_USER", ""),
        password=os.environ.get("EMAIL_HOST_PASSWORD", ""),
        use_tls=True,
    )


@csrf_exempt
@require_POST
def forgot_password(request):
    email = (_body(request).get("email") or "").strip()
    user = (
        User.objects.filter(email__iexact=email, is_active=True).first()
        if email
        else None
    )
    if user:
        site = os.environ.get("SITE_NAME", "our site")
        uid = urlsafe_base64_encode(force_bytes(str(user.pk)))
        token = default_token_generator.make_token(user)
        # The "Set a new password" page is served by this backend, so build the
        # link from the address this request came in on. Works locally and in
        # Codespaces without any extra settings.
        link = request.build_absolute_uri(
            f"/reset-password/?uid={uid}&token={token}"
        )
        if not os.environ.get("EMAIL_HOST"):
            # Testing mode (no email settings): don't send an email, just print
            # the link in the runserver terminal so it can be copied.
            print(
                f"\n[Testing mode - no email sent] Password reset link for "
                f"{user.get_username()}:\n{link}\n",
                flush=True,
            )
            return JsonResponse({"message": GENERIC_MESSAGE})
        try:
            EmailMessage(
                subject=f"Your {site} password reset",
                body=(
                    f"Hi {user.first_name or user.get_username()},\n\n"
                    "Use this link to choose a new password:\n\n"
                    f"{link}\n\n"
                    "If you didn't ask for this, you can ignore this email."
                ),
                from_email=os.environ.get("EMAIL_HOST_USER")
                or settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                connection=_connection(),
            ).send(fail_silently=False)
        except Exception:
            logger.exception("Could not send password reset email")
    # Same answer whether or not the email exists, so nobody can probe for accounts.
    return JsonResponse({"message": GENERIC_MESSAGE})


@csrf_exempt
@require_POST
def reset_password(request):
    data = _body(request)
    uid = data.get("uid") or ""
    token = data.get("token") or ""
    password = data.get("password") or ""
    invalid = {"error": "This reset link is invalid or has expired."}

    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
    except (User.DoesNotExist, ValueError, TypeError, OverflowError, ValidationError):
        return JsonResponse(invalid, status=400)
    if not default_token_generator.check_token(user, token):
        return JsonResponse(invalid, status=400)

    try:
        validate_password(password, user)
    except ValidationError as exc:
        return JsonResponse({"error": " ".join(exc.messages)}, status=400)

    user.set_password(password)
    user.save()
    return JsonResponse({"ok": True})