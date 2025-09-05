from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status

from inventory.models import Supplier
from inventory.serializers import SupplierSerializer


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def suppliers_list(request):
    if request.method == 'GET':
        qs = Supplier.objects.all()
        serializer = SupplierSerializer(qs, many=True)
        return Response(serializer.data)

    # POST - create (only supervisor/admin allowed)
    if not hasattr(request.user, 'role') or request.user.role not in ('admin', 'supervisor'):
        return Response({'message': 'Only admin and supervisor can create suppliers'}, status=status.HTTP_403_FORBIDDEN)

    serializer = SupplierSerializer(data=request.data)
    if serializer.is_valid():
        supplier = serializer.save()
        return Response(SupplierSerializer(supplier).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def supplier_detail(request, pk):
    supplier = get_object_or_404(Supplier, pk=pk)
    
    if request.method == 'GET':
        return Response(SupplierSerializer(supplier).data)
    
    # Only admin and supervisor can modify or delete suppliers
    if not hasattr(request.user, 'role') or request.user.role not in ('admin', 'supervisor'):
        return Response({'message': 'Only admin and supervisor can modify suppliers'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'PATCH':
        serializer = SupplierSerializer(supplier, data=request.data, partial=True)
        if serializer.is_valid():
            supplier = serializer.save()
            return Response(SupplierSerializer(supplier).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        supplier.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
