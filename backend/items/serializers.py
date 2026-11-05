from rest_framework import serializers
from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Item
        fields = "__all__"


class LostItemSerializer(ItemSerializer):
    class Meta(ItemSerializer.Meta):
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