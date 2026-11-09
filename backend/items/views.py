from rest_framework import viewsets
from rest_framework import mixins
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Item
from .serializers import ItemSerializer, LostItemSerializer, StaffItemSerializer


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class IsOwnerOrSuperUser(BasePermission):
    """Only the person who submitted a report, or a superuser, may change it."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(user.is_superuser or obj.reported_by_id == user.pk)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class LostItemViewSet(viewsets.ModelViewSet):
    """Lost item reports.

    - Browsing reports: anyone (reporter details are never included)
    - Submitting a report: must be logged in
    - Editing or deleting a report: only its owner or a superuser
    - Resolving a report into inventory: superuser only
    - /api/lost-items/mine/: the logged-in user's own reports
    """

    queryset = Item.objects.filter(status="lost").order_by("-created_at")
    serializer_class = LostItemSerializer

    def get_permissions(self):
        if self.action == "resolve":
            return [IsSuperUser()]
        if self.action in {"create", "mine"}:
            return [IsAuthenticated()]
        if self.action in {"update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsOwnerOrSuperUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        # Always take the reporter from the session, never from the request
        # body, so nobody can submit a report as someone else.
        serializer.save(reported_by=self.request.user)

    @action(detail=False, methods=["get"])
    def mine(self, request):
        items = self.get_queryset().filter(reported_by=request.user)
        return Response(self.get_serializer(items, many=True).data)

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
    """Found items.

    - Browsing: anyone (reporter details are only shown to superusers)
    - Turning in a found item: must be logged in
    - Removing from inventory: superuser only
    """

    serializer_class = ItemSerializer
    permission_classes = [IsSuperUser]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        user = getattr(self.request, "user", None)
        if user is not None and user.is_authenticated and user.is_superuser:
            return StaffItemSerializer
        return ItemSerializer

    def perform_create(self, serializer):
        if serializer.validated_data.get("status") != "found":
            raise ValidationError(
                {"status": "The Inventory API only accepts found items."}
            )

        serializer.save(
            inventory_status="available",
            inventory_date=timezone.localdate(),
            reported_by=self.request.user,
        )

    def get_queryset(self):
        return Item.objects.filter(status="found").order_by("-created_at")
