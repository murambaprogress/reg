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
        # Support pay all logic via ?pay_all=1 param or explicit field
        pay_all = request.GET.get('pay_all') == '1' or request.data.get('pay_all') == True
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if pay_all:
            data['amount_paid'] = supplier.amount
        # If amount_paid is set, check if it clears the supplier
        amount_paid = data.get('amount_paid', None)
        amount = data.get('amount', None)
        # Use new value if present, else fallback to existing
        try:
            amt_paid_val = float(amount_paid) if amount_paid is not None else float(supplier.amount_paid)
            amt_val = float(amount) if amount is not None else float(supplier.amount)
            if amt_paid_val >= amt_val:
                data['state'] = 'cleared'
        except Exception:
            pass
        serializer = SupplierSerializer(supplier, data=data, partial=True)
        if serializer.is_valid():
            supplier = serializer.save()
            return Response(SupplierSerializer(supplier).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        supplier.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

