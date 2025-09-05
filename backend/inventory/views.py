import jwt
from django.conf import settings
from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
import csv
from functools import wraps

from .models import Category, Part, InventoryTransaction, Supplier
from .serializers import CategorySerializer, PartSerializer, InventoryTransactionSerializer
from .serializers import SupplierSerializer
from .models import Customer
from .serializers import CustomerSerializer


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def categories(request):
    if request.method == 'GET':
        cats = Category.objects.all()
        serializer = CategorySerializer(cats, many=True)
        return Response(serializer.data)
    
    # POST - create category (admin/supervisor only)
    if not request.user.role in ('admin', 'supervisor'):
        return Response({'message': 'Only admin and supervisor can create categories'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        cat = serializer.save()
        return Response(CategorySerializer(cat).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def parts(request):
    """List all parts or create a new part"""
    if request.method == 'GET':
        try:
            qs = Part.objects.select_related('category').all()
            
            # Apply filters
            category = request.GET.get('category')
            search = request.GET.get('search')
            if category:
                qs = qs.filter(category__id=category)
            if search:
                qs = qs.filter(
                    Q(part_number__icontains=search) |
                    Q(description__icontains=search)
                )
            
            serializer = PartSerializer(qs, many=True)
            data = serializer.data
            
            # Convert snake_case to camelCase for frontend
            transformed_data = []
            for item in data:
                transformed_data.append({
                    'id': item['id'],
                    'partNumber': item['part_number'],
                    'description': item['description'],
                    'currentStock': item['current_stock'],
                    'minimumThreshold': item['minimum_threshold'],
                    'unitCost': item['unit_cost'],
                    'unit': item['unit'],
                    'category': item.get('category'),
                    'supplier': item.get('supplier', ''),
                    'location': item.get('location', ''),
                    'notes': item.get('notes', '')
                })
            return Response(transformed_data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch parts', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # POST - create part (admin/supervisor only)
    if not hasattr(request.user, 'role') or request.user.role not in ('admin', 'supervisor'):
        return Response(
            {'message': 'Only admin and supervisor can create parts'},
            status=status.HTTP_403_FORBIDDEN
        )
        
    serializer = PartSerializer(data=request.data)
    if serializer.is_valid():
        part = serializer.save()
        return Response(
            PartSerializer(part).data,
            status=status.HTTP_201_CREATED
        )
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def part_detail(request, pk):
    try:
        part = Part.objects.get(pk=pk)
    except Part.DoesNotExist:
        return Response({'message': 'Part not found'}, status=404)
    if request.method == 'GET':
        return Response(PartSerializer(part).data)
    # Update (admin)
    auth = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth.startswith('Bearer '):
        return Response({'message': 'Authorization required'}, status=401)
    token = auth.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get('role') != 'admin':
            return Response({'message': 'Forbidden'}, status=403)
    except Exception as e:
        return Response({'message': 'Invalid token', 'error': str(e)}, status=401)
    serializer = PartSerializer(part, data=request.data, partial=True)
    if serializer.is_valid():
        p = serializer.save()
        return Response(PartSerializer(p).data)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def assign_to_job(request):
    # expected: part_id, job_id, quantity, notes
    part_id = request.data.get('partId') or request.data.get('part_id')
    job_id = request.data.get('jobId') or request.data.get('job_id')
    quantity = int(request.data.get('quantity', 0))
    notes = request.data.get('notes', '')
    if not part_id or quantity <= 0:
        return Response({'message': 'Invalid payload'}, status=400)
    try:
        part = Part.objects.get(id=part_id)
    except Part.DoesNotExist:
        return Response({'message': 'Part not found'}, status=404)
    if part.current_stock < quantity:
        return Response({'message': 'Insufficient stock'}, status=400)
    # decrement stock
    part.current_stock -= quantity
    part.save()
    tx = InventoryTransaction.objects.create(part=part, type='stock-out', quantity=quantity, value=round(quantity * float(part.unit_cost), 2), notes=notes, related_job_id=job_id)
    return Response({'message': 'Assigned to job', 'transaction': InventoryTransactionSerializer(tx).data})


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def transactions(request):
    qs = InventoryTransaction.objects.select_related('part').all().order_by('-timestamp')
    serializer = InventoryTransactionSerializer(qs, many=True)
    return Response(serializer.data)


def decode_jwt_from_request(request):
    auth = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth.startswith('Bearer '):
        return None, {'message': 'Authorization required'}
    token = auth.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload, None
    except Exception as e:
        return None, {'message': 'Invalid token', 'error': str(e)}


def admin_required(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        payload, err = decode_jwt_from_request(request)
        if err:
            return Response(err, status=401)
        if payload.get('role') != 'admin':
            return Response({'message': 'Forbidden'}, status=403)
        request.user_payload = payload
        return view_func(request, *args, **kwargs)
    return _wrapped

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def part_history(request, pk):
    try:
        part = Part.objects.get(pk=pk)
    except Part.DoesNotExist:
        return Response({'message': 'Part not found'}, status=status.HTTP_404_NOT_FOUND)
    txs = part.transactions.all().order_by('-timestamp')
    serializer = InventoryTransactionSerializer(txs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@admin_required
def reorder_part(request):
    # simple reorder: create a stock-in transaction and increase stock
    part_id = request.data.get('partId') or request.data.get('part_id')
    qty = int(request.data.get('quantity', 0))
    notes = request.data.get('notes', '')
    if not part_id or qty <= 0:
        return Response({'message': 'Invalid payload'}, status=400)
    try:
        part = Part.objects.get(id=part_id)
    except Part.DoesNotExist:
        return Response({'message': 'Part not found'}, status=404)
    part.current_stock += qty
    part.save()
    tx = InventoryTransaction.objects.create(part=part, type='stock-in', quantity=qty, value=round(qty * float(part.unit_cost), 2), notes=notes or 'Reorder')
    return Response({'message': 'Reordered', 'transaction': InventoryTransactionSerializer(tx).data})


@api_view(['GET'])
def export_parts_csv(request):
    qs = Part.objects.all()
    # stream CSV
    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename="parts.csv"'
    writer = csv.writer(resp)
    writer.writerow(['id', 'part_number', 'description', 'category', 'current_stock', 'minimum_threshold', 'supplier', 'unit_cost', 'unit', 'location'])
    for p in qs:
        writer.writerow([p.id, p.part_number, p.description, p.category.name if p.category else '', p.current_stock, p.minimum_threshold, p.supplier, str(p.unit_cost), p.unit, p.location])
    return resp


@api_view(['GET', 'POST'])
def customers(request):
    if request.method == 'GET':
        qs = Customer.objects.all()
        serializer = CustomerSerializer(qs, many=True)
        return Response(serializer.data)
    # POST - create customer (allow admin/supervisor)
    payload, err = decode_jwt_from_request(request)
    if err:
        return Response(err, status=401)
    if payload.get('role') not in ('admin', 'supervisor'):
        return Response({'message': 'Forbidden'}, status=403)
    serializer = CustomerSerializer(data=request.data)
    if serializer.is_valid():
        c = serializer.save()
        return Response(CustomerSerializer(c).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PATCH', 'DELETE'])
def customer_detail(request, pk):
    try:
        cust = Customer.objects.get(pk=pk)
    except Customer.DoesNotExist:
        return Response({'message': 'Customer not found'}, status=404)
    if request.method == 'GET':
        return Response(CustomerSerializer(cust).data)
    # Update (admin/supervisor)
    payload, err = decode_jwt_from_request(request)
    if err:
        return Response(err, status=401)
    if payload.get('role') not in ('admin', 'supervisor'):
        return Response({'message': 'Forbidden'}, status=403)
    serializer = CustomerSerializer(cust, data=request.data, partial=True)
    if serializer.is_valid():
        c = serializer.save()
        return Response(CustomerSerializer(c).data)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def scan_barcode(request):
    # placeholder implementation: look up by part_number
    code = request.data.get('code')
    if not code:
        return Response({'message': 'No code provided'}, status=400)
    part = Part.objects.filter(part_number=code).first()
    if not part:
        return Response({'message': 'Part not found'}, status=404)
    return Response(PartSerializer(part).data)


@api_view(['GET', 'POST'])
def suppliers(request):
    if request.method == 'GET':
        qs = Supplier.objects.all()
        serializer = SupplierSerializer(qs, many=True)
        return Response(serializer.data)
    # POST (admin)
    payload, err = decode_jwt_from_request(request)
    if err:
        return Response(err, status=401)
    if payload.get('role') != 'admin':
        return Response({'message': 'Forbidden'}, status=403)
    serializer = SupplierSerializer(data=request.data)
    if serializer.is_valid():
        s = serializer.save()
        return Response(SupplierSerializer(s).data, status=201)
    return Response(serializer.errors, status=400)
