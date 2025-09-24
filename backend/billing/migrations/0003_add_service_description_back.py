# Generated manually to fix service_description field issue

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0002_alter_invoice_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='service_description',
            field=models.TextField(blank=True),
        ),
    ]
