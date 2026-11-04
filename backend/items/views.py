from rest_framework import viewsets
from rest_framework import mixins
from rest_framework.permissions import BasePermission
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Item
from .serializers import ItemSerializer


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by("-created_at")
    serializer_class = ItemSerializer

    def perform_create(self, serializer):
        if serializer.validated_data.get("status") == "found":
            serializer.save(
                inventory_status="available",
                inventory_date=timezone.localdate(),
            )
            return

        serializer.save()


@method_decorator(ensure_csrf_cookie, name="dispatch")
class InventoryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ItemSerializer
    permission_classes = [IsSuperUser]

    def get_queryset(self):
        return Item.objects.filter(status="found").order_by("-created_at")