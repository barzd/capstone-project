from rest_framework import viewsets
from rest_framework import mixins
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Item
from .serializers import ItemSerializer, LostItemSerializer


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


@method_decorator(ensure_csrf_cookie, name="dispatch")
class LostItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.filter(status="lost").order_by("-created_at")
    serializer_class = LostItemSerializer

    def get_permissions(self):
        if self.action == "resolve":
            return [IsSuperUser()]
        return [AllowAny()]

    @action(detail=True, methods=["post"], permission_classes=[IsSuperUser])
    def resolve(self, request, pk=None):
        item = self.get_object()
        self.mark_as_found(item)
        return Response(self.get_serializer(item).data)

    @staticmethod
    def mark_as_found(item):
        item.status = "found"
        item.inventory_status = "available"
        item.inventory_date = timezone.localdate()
        item.save(
            update_fields=["status", "inventory_status", "inventory_date"]
        )


@method_decorator(ensure_csrf_cookie, name="dispatch")
class InventoryViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ItemSerializer
    permission_classes = [IsSuperUser]

    def get_permissions(self):
        if self.action in {"create", "list", "retrieve"}:
            return [AllowAny()]
        return super().get_permissions()

    def perform_create(self, serializer):
        if serializer.validated_data.get("status") != "found":
            raise ValidationError(
                {"status": "The Inventory API only accepts found items."}
            )

        serializer.save(
            inventory_status="available",
            inventory_date=timezone.localdate(),
        )

    def get_queryset(self):
        return Item.objects.filter(status="found").order_by("-created_at")