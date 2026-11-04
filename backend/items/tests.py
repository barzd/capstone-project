from datetime import date
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from items.models import Item
from items.serializers import ItemSerializer
from items.views import ItemViewSet


class ItemViewSetTests(SimpleTestCase):
    @patch("items.views.timezone.localdate", return_value=date(2026, 11, 4))
    def test_found_item_is_added_to_inventory(self, localdate):
        item_serializer = Mock()
        item_serializer.validated_data = {"status": "found"}

        ItemViewSet().perform_create(item_serializer)

        item_serializer.save.assert_called_once_with(
            inventory_status="available",
            inventory_date=date(2026, 11, 4),
        )

    def test_other_reports_are_not_added_to_inventory(self):
        item_serializer = Mock()
        item_serializer.validated_data = {"status": "lost"}

        ItemViewSet().perform_create(item_serializer)

        item_serializer.save.assert_called_once_with()

    def test_item_id_is_generated_by_database_and_read_only_in_api(self):
        self.assertTrue(Item._meta.pk.auto_created)
        self.assertTrue(ItemSerializer().fields["id"].read_only)
