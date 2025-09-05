from rest_framework import serializers
from .models import Sale, SaleItem
from inventory.models import Part, Customer


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = ('id', 'part_number', 'name', 'qty', 'unit')


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    customer_id = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), source='customer', write_only=True, required=False, allow_null=True)
    customer = serializers.SerializerMethodField(read_only=True)
    customer_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Sale
        fields = ('id', 'date', 'customer_id', 'customer', 'customer_name', 'items', 'total')

    def get_customer(self, obj):
        if obj.customer:
            return {'id': obj.customer.id, 'name': obj.customer.name}
        return None

    def validate(self, data):
        # Check if we need to create a new customer
        customer_name = data.pop('customer_name', None)
        if not data.get('customer') and customer_name:
            customer, created = Customer.objects.get_or_create(
                name=customer_name,
                defaults={'phone': '', 'email': '', 'address': ''}
            )
            data['customer'] = customer

        # Validate items and check inventory availability
        items = data.get('items', [])
        for idx, it in enumerate(items):
            pn = it.get('part_number')
            qty = int(it.get('qty') or 0)
            if not pn:
                raise serializers.ValidationError({f'items[{idx}].part_number': 'Part number is required for every sale item'})
            try:
                part = Part.objects.get(part_number=pn)
                if part.current_stock < qty:
                    raise serializers.ValidationError({f'items[{idx}].qty': f'Insufficient stock. Available: {part.current_stock}'})
            except Part.DoesNotExist:
                raise serializers.ValidationError({f'items[{idx}].part_number': 'Part not found'})
            if qty <= 0:
                raise serializers.ValidationError({f'items[{idx}].qty': 'Quantity must be greater than zero'})
            if part.current_stock < qty:
                raise serializers.ValidationError({f'items[{idx}].qty': f'Insufficient stock for part {pn} (available {part.current_stock})'})
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Calculate total from items
        total = sum(int(item.get('qty', 0)) * float(item.get('unit', 0)) for item in items_data)
        validated_data['total'] = total
        
        sale = Sale.objects.create(**validated_data)
        
        # Create items (stock deduction is handled in views.py)
        for it in items_data:
            SaleItem.objects.create(sale=sale, **it)
        
        return sale

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Calculate total from items
        total = sum(int(item.get('qty', 0)) * float(item.get('unit', 0)) for item in items_data)
        validated_data['total'] = total
        
        # Update sale fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance
