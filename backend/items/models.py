
from django.conf import settings
from django.db import models


class Item(models.Model):
    STATUS_CHOICES = [
        ("lost", "Lost"), ("found", "Found"), ("returned", "Returned"),
    ]

    INVENTORY_STATUS_CHOICES = [
        ("not_added", "Not Added"), ("available", "Available"),("claimed", "Claimed"), ("disposed", "Disposed"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    color = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    inventory_status = models.CharField(
        max_length=20,
        choices=INVENTORY_STATUS_CHOICES,
        default="not_added",
    )

    storage_location = models.CharField(
        max_length=200,
        blank=True,
    )

    inventory_date = models.DateField(
        null=True,
        blank=True,
    )

    # Who submitted the report. Set by the server from the logged-in user and
    # never returned by the public APIs (see serializers.py), so students'
    # personal details stay private. Only superusers can see it.
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reported_items",
    )

    def __str__(self):
        return self.title
