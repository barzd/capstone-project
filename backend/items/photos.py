"""Photo upload helpers for lost and found reports."""

import uuid

from django.http import Http404, HttpResponse
from rest_framework import serializers

# Photos are stored inside the item's MongoDB document (16 MB limit), so keep
# them small. The frontend shrinks photos before uploading; this is the
# server-side safety limit.
MAX_PHOTO_BYTES = 5 * 1024 * 1024
MAX_PHOTO_MB = MAX_PHOTO_BYTES // (1024 * 1024)


def detect_image_type(data: bytes) -> str | None:
    """Return the image MIME type based on the file's actual contents.

    Only JPEG, PNG, and WebP are allowed. The browser-supplied content type
    and file name are ignored because they can be faked (e.g. an SVG or HTML
    file renamed to .jpg).
    """
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def read_photo_upload(upload) -> dict:
    """Validate an uploaded photo and return its bytes and content type."""
    if upload.size > MAX_PHOTO_BYTES:
        raise serializers.ValidationError(
            f"Photo is too large. The maximum size is {MAX_PHOTO_MB} MB."
        )
    data = upload.read()
    content_type = detect_image_type(data)
    if content_type is None:
        raise serializers.ValidationError(
            "Photo must be a JPEG, PNG, or WebP image."
        )
    return {"data": data, "content_type": content_type}


def move_photo_into(validated_data: dict) -> None:
    """Turn the validated 'photo' upload into the model's photo fields."""
    photo = validated_data.pop("photo", None)
    if photo:
        validated_data["photo"] = photo["data"]
        validated_data["photo_content_type"] = photo["content_type"]
        # New version -> new photo_url, so browsers don't show the old photo.
        validated_data["photo_version"] = uuid.uuid4().hex[:12]


def photo_response(item) -> HttpResponse:
    """Serve an item's photo, or 404 if it has none."""
    if not item.photo or not item.photo_content_type:
        raise Http404("This item has no photo.")
    response = HttpResponse(bytes(item.photo), content_type=item.photo_content_type)
    # Never let the browser guess a different (e.g. HTML/script) type.
    response["X-Content-Type-Options"] = "nosniff"
    response["Content-Disposition"] = "inline"
    response["Cache-Control"] = "public, max-age=86400"
    return response
