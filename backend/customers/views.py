from rest_framework.decorators import api_view
from rest_framework.response import Response
from inventory.models import Customer
from inventory.serializers import CustomerSerializer
from inventory.views import decode_jwt_from_request


@api_view(['GET', 'POST'])
def customers(request):
    if request.method == 'GET':
        qs = Customer.objects.all()
        serializer = CustomerSerializer(qs, many=True)
        return Response(serializer.data)
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
