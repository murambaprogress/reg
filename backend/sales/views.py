from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from .serializers import SaleSerializer
from .models import Sale


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def sales_list(request):
    """List all sales or create a new sale"""

    if request.method == 'GET':
        qs = Sale.objects.all().order_by('-date')
        serializer = SaleSerializer(qs, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SaleSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Start a transaction to ensure all operations succeed or none do
                from django.db import transaction
                from inventory.models import Part, InventoryTransaction

                with transaction.atomic():
                    # First validate all items have sufficient stock
                    items_data = request.data.get('items', [])
                    for item in items_data:
                        part_number = item.get('part_number')
                        qty = int(item.get('qty', 0))
                        
                        if part_number:
                            part = Part.objects.get(part_number=part_number)
                            if part.current_stock < qty:
                                return Response(
                                    {'message': f'Insufficient stock for {part_number}. Available: {part.current_stock}'},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                    
                    # Create the sale
                    sale = serializer.save()
                    
                    # Update inventory for each item
                    for item in sale.items.all():
                        if item.part_number:
                            part = Part.objects.get(part_number=item.part_number)
                            # Deduct stock
                            part.current_stock = max(0, part.current_stock - item.qty)
                            part.save()
                            
                            # Record the transaction
                            InventoryTransaction.objects.create(
                                part=part,
                                type='stock-out',
                                quantity=item.qty,
                                value=item.unit * item.qty,
                                notes=f'Sale #{sale.id}'
                            )
                    
                    return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)
            except Part.DoesNotExist as e:
                return Response({'message': f'Part not found: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def customer_sales(request, customer_id):
    """Get all sales for a specific customer"""
    try:
        sales = Sale.objects.filter(customer_id=customer_id).order_by('-date')
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def sales_stats(request):
    """Get sales statistics"""
    try:
        # Get today's stats
        today = timezone.now().date()
        today_sales = Sale.objects.filter(
            date__date=today
        ).aggregate(
            total=Sum('total'),
            count=Count('id')
        )

        # Get this week's stats
        week_start = today - timedelta(days=today.weekday())
        week_sales = Sale.objects.filter(
            date__date__gte=week_start
        ).aggregate(
            total=Sum('total'),
            count=Count('id')
        )

        return Response({
            'today': {
                'total': float(today_sales['total'] or 0),
                'count': today_sales['count'] or 0
            },
            'week': {
                'total': float(week_sales['total'] or 0),
                'count': week_sales['count'] or 0
            }
        })
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def sale_items(request):
    """Get all sale items"""
    try:
        qs = Sale.objects.all().prefetch_related('items').order_by('-date')
        data = []
        for sale in qs:
            sale_data = SaleSerializer(sale).data
            sale_data['items'] = [
                {
                    'part_number': item.part_number,
                    'name': item.name,
                    'qty': item.qty,
                    'unit': float(item.unit)
                }
                for item in sale.items.all()
            ]
            data.append(sale_data)
        return Response(data)
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def sale_detail(request, pk):
    try:
        s = Sale.objects.get(pk=pk)
    except Sale.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)

    if request.method == 'GET':
        return Response(SaleSerializer(s).data)

    if request.method == 'PUT':
        serializer = SaleSerializer(s, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                from django.db import transaction
                from inventory.models import Part, InventoryTransaction

                with transaction.atomic():
                    # First, restore stock from the original sale
                    for item in s.items.all():
                        if item.part_number:
                            try:
                                part = Part.objects.get(part_number=item.part_number)
                                part.current_stock += item.qty
                                part.save()
                                
                                # Record the restoration transaction
                                InventoryTransaction.objects.create(
                                    part=part,
                                    type='stock-in',
                                    quantity=item.qty,
                                    value=item.unit * item.qty,
                                    notes=f'Sale #{s.id} update - stock restored'
                                )
                            except Part.DoesNotExist:
                                pass
                    
                    # Delete old items
                    s.items.all().delete()
                    
                    # Validate new items have sufficient stock
                    items_data = request.data.get('items', [])
                    for item in items_data:
                        part_number = item.get('part_number')
                        qty = int(item.get('qty', 0))
                        
                        if part_number:
                            part = Part.objects.get(part_number=part_number)
                            if part.current_stock < qty:
                                return Response(
                                    {'message': f'Insufficient stock for {part_number}. Available: {part.current_stock}'},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                    
                    # Update the sale
                    sale = serializer.save()
                    
                    # Create new items and deduct stock
                    for item_data in items_data:
                        from .models import SaleItem
                        item = SaleItem.objects.create(
                            sale=sale,
                            part_number=item_data.get('part_number', ''),
                            name=item_data.get('name', ''),
                            qty=int(item_data.get('qty', 0)),
                            unit=float(item_data.get('unit', 0))
                        )
                        
                        if item.part_number:
                            part = Part.objects.get(part_number=item.part_number)
                            part.current_stock = max(0, part.current_stock - item.qty)
                            part.save()
                            
                            # Record the transaction
                            InventoryTransaction.objects.create(
                                part=part,
                                type='stock-out',
                                quantity=item.qty,
                                value=item.unit * item.qty,
                                notes=f'Sale #{sale.id} update'
                            )
                    
                    return Response(SaleSerializer(sale).data)
            except Part.DoesNotExist as e:
                return Response({'message': f'Part not found: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        # Restore stock when deleting
        try:
            from django.db import transaction
            from inventory.models import Part, InventoryTransaction

            with transaction.atomic():
                for item in s.items.all():
                    if item.part_number:
                        try:
                            part = Part.objects.get(part_number=item.part_number)
                            part.current_stock += item.qty
                            part.save()
                            
                            # Record the restoration transaction
                            InventoryTransaction.objects.create(
                                part=part,
                                type='stock-in',
                                quantity=item.qty,
                                value=item.unit * item.qty,
                                notes=f'Sale #{s.id} deleted - stock restored'
                            )
                        except Part.DoesNotExist:
                            pass
                
                s.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
