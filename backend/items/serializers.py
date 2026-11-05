from rest_framework import serializers
from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Item
        fields = "__all__"


class LostItemSerializer(ItemSerializer):
    def validate_status(self, value):
        if value != "lost":
            raise serializers.ValidationError(
                "The Lost Items API only accepts reports with status 'lost'."
            )
        return value