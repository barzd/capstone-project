from django.urls import NoReverseMatch, reverse
from rest_framework import serializers
from .models import Item
from .photos import move_photo_into, read_photo_upload


class ItemSerializer(serializers.ModelSerializer):
    """Public view of an item.

    Privacy: anyone using the app can read these fields, so it never includes
    who reported the item (no names, emails, or account IDs).
    """

    id = serializers.CharField(read_only=True)
    # Optional photo upload (multipart form field "photo"). Write-only: the
    # image itself is served separately at photo_url.
    photo = serializers.FileField(write_only=True, required=False, allow_empty_file=False)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Item
        # The raw photo bytes are never sent in JSON responses.
        exclude = ["reported_by", "photo_content_type"]

    def validate_photo(self, upload):
        return read_photo_upload(upload)

    def get_photo_url(self, item):
        if not item.photo_content_type:
            return None
        view = self.context.get("view")
        request = self.context.get("request")
        basename = getattr(view, "basename", None)
        if not basename or request is None:
            return None
        try:
            path = reverse(f"{basename}-photo", kwargs={"pk": str(item.pk)})
        except NoReverseMatch:
            return None
        return request.build_absolute_uri(path)

    def create(self, validated_data):
        move_photo_into(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        move_photo_into(validated_data)
        return super().update(instance, validated_data)


class LostItemSerializer(ItemSerializer):
    class Meta(ItemSerializer.Meta):
        exclude = None
        fields = [
            "id",
            "title",
            "description",
            "category",
            "color",
            "location",
            "date",
            "photo",
            "photo_url",
        ]

    def create(self, validated_data):
        validated_data["status"] = "lost"
        return super().create(validated_data)


class StaffItemSerializer(ItemSerializer):
    """Superuser-only view of an item.

    Staff need to know who turned an item in so they can follow up about
    claims and pickups. Only used when the logged-in user is a superuser.
    """

    reported_by_username = serializers.SerializerMethodField()
    reported_by_email = serializers.SerializerMethodField()

    class Meta(ItemSerializer.Meta):
        pass

    def get_reported_by_username(self, item):
        return item.reported_by.username if item.reported_by else None

    def get_reported_by_email(self, item):
        return item.reported_by.email if item.reported_by else None
