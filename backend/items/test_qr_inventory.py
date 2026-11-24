from datetime import date
from unittest.mock import patch

from bson import ObjectId
from django.urls import reverse
from rest_framework.test import APIClient

from items.models import Item
from items.views import InventoryViewSet


def test_checkout_page_can_load_a_claimed_item_without_private_details(monkeypatch):
    item = Item(
        pk=ObjectId(),
        title="Blue water bottle",
        description="A unique scratch under the lid",
        category="Drinkware",
        color="Blue",
        location="Library",
        status="found",
        inventory_status="claimed",
        date=date(2026, 11, 21),
        storage_location="Police department evidence room",
    )
    monkeypatch.setattr(InventoryViewSet, "get_object", lambda self: item)

    with patch("items.views.ItemCheckout.objects.filter") as checkout_filter:
        checkout_filter.return_value.exists.return_value = False
        response = APIClient().get(
            reverse("inventory-checkout-info", kwargs={"pk": str(item.pk)})
        )

    assert response.status_code == 200
    assert response.json()["id"] == str(item.pk)
    assert response.json()["title"] == item.title
    assert "description" not in response.json()
    assert "storage_location" not in response.json()
