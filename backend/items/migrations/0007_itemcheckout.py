import django.db.models.deletion
from django.db import migrations, models
import django_mongodb_backend.fields


class Migration(migrations.Migration):

    dependencies = [
        ("items", "0006_itemclaim"),
    ]

    operations = [
        migrations.CreateModel(
            name="ItemCheckout",
            fields=[
                (
                    "id",
                    django_mongodb_backend.fields.ObjectIdAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("item_identifier", models.CharField(max_length=100)),
                ("item_title", models.CharField(max_length=200)),
                ("name", models.CharField(max_length=150)),
                ("checked_out_date", models.DateField()),
                ("recorded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "item",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="checkouts",
                        to="items.item",
                    ),
                ),
            ],
            options={"ordering": ["-recorded_at"]},
        ),
    ]
