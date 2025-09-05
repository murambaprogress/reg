from rest_framework import serializers
from .models import Category, Part, InventoryTransaction
from .models import Supplier
from .models import Customer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'description')


class PartSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True)

    class Meta:
        model = Part
        fields = ('id', 'part_number', 'description', 'category', 'category_id', 'current_stock', 'minimum_threshold', 'supplier', 'unit_cost', 'unit', 'location', 'notes')


class InventoryTransactionSerializer(serializers.ModelSerializer):
    part = PartSerializer(read_only=True)
    part_id = serializers.PrimaryKeyRelatedField(queryset=Part.objects.all(), source='part', write_only=True)

    class Meta:
        model = InventoryTransaction
        fields = ('id', 'part', 'part_id', 'type', 'quantity', 'value', 'timestamp', 'notes', 'related_job_id')


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ('id', 'name', 'contact', 'email', 'phone', 'amount', 'due_date', 'state', 
                 'products_supplied', 'previous', 'future', 'payments')


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ('id', 'name', 'email', 'phone', 'address', 'preferred_contact', 'notes', 'status', 'join_date', 'last_service_date', 'total_spent', 'metadata')
