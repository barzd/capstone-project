from rest_framework import serializers
from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    """Public view of an item.

    Privacy: anyone using the app can read these fields, so it never includes
    who reported the item (no names, emails, or account IDs).
    """

    id = serializers.CharField(read_only=True)

    class Meta:
        model = Item
        exclude = ["reported_by"]


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
