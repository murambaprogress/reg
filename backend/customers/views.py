from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
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
    
    serializer = CustomerSerializer(data=request.data)
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
    
    serializer = CustomerSerializer(cust, data=request.data, partial=True)
    if serializer.is_valid():
        c = serializer.save()
        return Response(CustomerSerializer(c).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
