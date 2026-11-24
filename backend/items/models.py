
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

    # Optional photo of the item, stored in the database (not on disk) so every
    # teammate sharing the database can see it. Served by the /photo/ endpoint;
    # never included in list responses.
    photo = models.BinaryField(null=True, blank=True, editable=False)
    photo_content_type = models.CharField(max_length=50, blank=True, editable=False)
    # Changes every time a new photo is uploaded. It's added to photo_url so
    # browsers fetch the new photo instead of showing a cached old one.
    photo_version = models.CharField(max_length=32, blank=True, editable=False)

    def __str__(self):
        return self.title


class ItemClaim(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    item = models.ForeignKey(
        Item,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="claims",
    )
    item_identifier = models.CharField(max_length=100)
    item_title = models.CharField(max_length=200)
    claimed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="item_claims",
    )
    identifying_details = models.TextField(max_length=2000)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    staff_notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_item_claims",
    )

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Claim for {self.item} by {self.claimed_by}"


class ItemCheckout(models.Model):
    item = models.ForeignKey(
        Item,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checkouts",
    )
    item_identifier = models.CharField(max_length=100)
    item_title = models.CharField(max_length=200)
    name = models.CharField(max_length=150)
    checked_out_date = models.DateField()
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"Checkout for {self.item_title} by {self.name}"
