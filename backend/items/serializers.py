from rest_framework import serializers
from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Item
        fields = "__all__"