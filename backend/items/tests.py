from datetime import date
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated

from items.models import Item
from items.serializers import (
    ItemSerializer,
    LostItemSerializer,
    StaffItemSerializer,
)
from items.views import (
    InventoryViewSet,
    IsOwnerOrSuperUser,
    IsSuperUser,
    LostItemViewSet,
)


class LostItemSerializerTests(SimpleTestCase):
    def test_lost_item_api_only_exposes_lost_report_fields(self):
        serializer = LostItemSerializer()

        self.assertEqual(
            set(serializer.fields),
            {"id", "title", "description", "category", "color", "location", "date"},
        )
        self.assertNotIn("status", serializer.fields)
        self.assertNotIn("inventory_status", serializer.fields)
        self.assertNotIn("storage_location", serializer.fields)
        self.assertNotIn("inventory_date", serializer.fields)


class LostItemViewSetTests(SimpleTestCase):
    @patch("items.views.timezone.localdate", return_value=date(2026, 11, 4))
    def test_resolving_lost_item_adds_it_to_inventory(self, localdate):
        item = Mock()

        LostItemViewSet.mark_as_found(item)

        self.assertEqual(item.status, "found")
        self.assertEqual(item.inventory_status, "available")
        self.assertEqual(item.inventory_date, date(2026, 11, 4))
        item.save.assert_called_once_with(
            update_fields=["status", "inventory_status", "inventory_date"]
        )

    def test_resolving_lost_item_requires_superuser(self):
        view = LostItemViewSet()
        view.action = "resolve"

        self.assertIsInstance(view.get_permissions()[0], IsSuperUser)


class InventoryViewSetTests(SimpleTestCase):
    def test_inventory_read_access_is_public(self):
        for action in ("list", "retrieve"):
            view = InventoryViewSet()
            view.action = action

            self.assertIsInstance(view.get_permissions()[0], AllowAny)

    def test_inventory_deletion_remains_superuser_only(self):
        view = InventoryViewSet()
        view.action = "destroy"

        self.assertIsInstance(view.get_permissions()[0], IsSuperUser)

    @patch("items.views.timezone.localdate", return_value=date(2026, 11, 4))
    def test_found_item_is_added_to_inventory(self, localdate):
        item_serializer = Mock()
        item_serializer.validated_data = {"status": "found"}
        view = InventoryViewSet()
        view.request = Mock(user=Mock(name="finder"))

        view.perform_create(item_serializer)

        item_serializer.save.assert_called_once_with(
            inventory_status="available",
            inventory_date=date(2026, 11, 4),
            reported_by=view.request.user,
        )

    def test_lost_item_is_rejected_by_inventory(self):
        item_serializer = Mock()
        item_serializer.validated_data = {"status": "lost"}

        with self.assertRaisesMessage(
            ValidationError, "The Inventory API only accepts found items."
        ):
            InventoryViewSet().perform_create(item_serializer)

        item_serializer.save.assert_not_called()

    def test_item_id_is_generated_by_database_and_read_only_in_api(self):
        self.assertTrue(Item._meta.pk.auto_created)
        self.assertTrue(ItemSerializer().fields["id"].read_only)


def make_user(pk, *, is_superuser=False, is_authenticated=True):
    return Mock(pk=pk, is_superuser=is_superuser, is_authenticated=is_authenticated)


class PrivacyProtectionTests(SimpleTestCase):
    """User story: Privacy Protection.

    As a student, I want my personal information to stay private, so that my
    contact details are not shown to everyone using the system.
    """

    # --- Reporter details are never public --------------------------------

    def test_public_serializers_never_include_reporter(self):
        for serializer in (ItemSerializer(), LostItemSerializer()):
            fields = set(serializer.fields)
            self.assertNotIn("reported_by", fields)
            self.assertNotIn("reported_by_username", fields)
            self.assertNotIn("reported_by_email", fields)

    def test_staff_serializer_shows_reporter_for_follow_up(self):
        fields = set(StaffItemSerializer().fields)
        self.assertIn("reported_by_username", fields)
        self.assertIn("reported_by_email", fields)
        self.assertNotIn("reported_by", fields)

    def test_only_superusers_get_reporter_details_in_inventory(self):
        cases = [
            (make_user(1, is_superuser=True), StaffItemSerializer),
            (make_user(2), ItemSerializer),
            (make_user(None, is_authenticated=False), ItemSerializer),
        ]
        for user, expected in cases:
            view = InventoryViewSet()
            view.request = Mock(user=user)
            self.assertIs(view.get_serializer_class(), expected)

    # --- Reports are tied to the logged-in user ---------------------------

    def test_submitting_reports_requires_login(self):
        for viewset in (LostItemViewSet, InventoryViewSet):
            view = viewset()
            view.action = "create"
            self.assertIsInstance(view.get_permissions()[0], IsAuthenticated)

    def test_lost_report_is_saved_with_logged_in_user(self):
        item_serializer = Mock()
        view = LostItemViewSet()
        view.request = Mock(user=make_user(7))

        view.perform_create(item_serializer)

        item_serializer.save.assert_called_once_with(reported_by=view.request.user)

    def test_reporter_cannot_be_set_through_the_api(self):
        self.assertNotIn("reported_by", LostItemSerializer().fields)
        self.assertNotIn("reported_by", ItemSerializer().fields)

    # --- Only the owner (or staff) can change a report --------------------

    def test_editing_or_deleting_lost_report_checks_ownership(self):
        for action in ("update", "partial_update", "destroy"):
            view = LostItemViewSet()
            view.action = action
            permissions = view.get_permissions()
            self.assertIsInstance(permissions[0], IsAuthenticated)
            self.assertIsInstance(permissions[1], IsOwnerOrSuperUser)

    def test_browsing_lost_reports_stays_public(self):
        for action in ("list", "retrieve"):
            view = LostItemViewSet()
            view.action = action
            self.assertIsInstance(view.get_permissions()[0], AllowAny)

    def test_owner_or_superuser_permission(self):
        permission = IsOwnerOrSuperUser()
        report = Mock(reported_by_id=1)
        cases = [
            (make_user(1), True),                          # owner
            (make_user(2), False),                         # another student
            (make_user(3, is_superuser=True), True),       # staff
            (make_user(None, is_authenticated=False), False),  # logged out
        ]
        for user, allowed in cases:
            request = Mock(user=user)
            self.assertEqual(
                permission.has_object_permission(request, None, report), allowed
            )

    def test_reports_without_an_owner_can_only_be_changed_by_staff(self):
        permission = IsOwnerOrSuperUser()
        old_report = Mock(reported_by_id=None)
        self.assertFalse(
            permission.has_object_permission(Mock(user=make_user(2)), None, old_report)
        )
        self.assertTrue(
            permission.has_object_permission(
                Mock(user=make_user(3, is_superuser=True)), None, old_report
            )
        )

    # --- My reports ---------------------------------------------------------

    def test_my_reports_requires_login(self):
        view = LostItemViewSet()
        view.action = "mine"
        self.assertIsInstance(view.get_permissions()[0], IsAuthenticated)
