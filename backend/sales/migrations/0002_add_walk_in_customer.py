from django.db import migrations

def create_walk_in_customer(apps, schema_editor):
    Customer = apps.get_model('inventory', 'Customer')
    if not Customer.objects.filter(name='Walk-in').exists():
        Customer.objects.create(
            name='Walk-in',
            phone='',
            email='',
            address=''
        )

def remove_walk_in_customer(apps, schema_editor):
    Customer = apps.get_model('inventory', 'Customer')
    Customer.objects.filter(name='Walk-in').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('sales', '0001_initial'),
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_walk_in_customer, remove_walk_in_customer),
    ]
