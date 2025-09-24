from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from inventory.models import Customer
from inventory.serializers import CustomerSerializer


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def customers(request):
    if request.method == 'GET':
        qs = Customer.objects.all()
        serializer = CustomerSerializer(qs, many=True)
        return Response(serializer.data)
    
    # POST - create customer (admin/supervisor only)
    if not hasattr(request.user, 'role') or request.user.role not in ('admin', 'supervisor'):
        return Response({'message': 'Only admin and supervisor can create customers'}, status=status.HTTP_403_FORBIDDEN)
    
    # handle inventory_sold as JSON string if array provided
    data = request.data.copy()
    inv_sold = data.get('inventorySold')
    if isinstance(inv_sold, list):
        import json
        data['inventory_sold'] = json.dumps(inv_sold)
    elif isinstance(inv_sold, str):
        data['inventory_sold'] = inv_sold
    if 'amountReceived' in data:
        data['amount_received'] = data['amountReceived']
    if 'fullCost' in data:
        data['full_cost'] = data['fullCost']
    serializer = CustomerSerializer(data=data)
    if serializer.is_valid():
        c = serializer.save()
        return Response(CustomerSerializer(c).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def customer_detail(request, pk):
    try:
        cust = Customer.objects.get(pk=pk)
    except Customer.DoesNotExist:
        return Response({'message': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        return Response(CustomerSerializer(cust).data)
    
    # Update/Delete - admin/supervisor only
    if not hasattr(request.user, 'role') or request.user.role not in ('admin', 'supervisor'):
        return Response({'message': 'Only admin and supervisor can modify customers'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'DELETE':
        cust.delete()
        return Response({'message': 'Customer deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    
    # handle inventory_sold as JSON string if array provided
    data = request.data.copy()
    inv_sold = data.get('inventorySold')
    if isinstance(inv_sold, list):
        import json
        data['inventory_sold'] = json.dumps(inv_sold)
    elif isinstance(inv_sold, str):
        data['inventory_sold'] = inv_sold
    if 'amountReceived' in data:
        data['amount_received'] = data['amountReceived']
    if 'fullCost' in data:
        data['full_cost'] = data['fullCost']
    serializer = CustomerSerializer(cust, data=data, partial=True)
    if serializer.is_valid():
        c = serializer.save()
        return Response(CustomerSerializer(c).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def customer_search(request):
    """Search customers by name, phone, or email"""
    search_term = request.query_params.get('search', '')
    
    if not search_term:
        return Response({'results': []})
    
    customers = Customer.objects.filter(
        Q(name__icontains=search_term) |
        Q(phone__icontains=search_term) |
        Q(email__icontains=search_term)
    )
    
    serializer = CustomerSerializer(customers, many=True)
    return Response({'results': serializer.data})
