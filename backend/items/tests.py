from datetime import date
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny

from items.models import Item
from items.serializers import ItemSerializer, LostItemSerializer
from items.views import InventoryViewSet, IsSuperUser, LostItemViewSet


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

        InventoryViewSet().perform_create(item_serializer)

        item_serializer.save.assert_called_once_with(
            inventory_status="available",
            inventory_date=date(2026, 11, 4),
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
