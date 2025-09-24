import os
import sys
sys.path.insert(0, 'backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend_project.settings')
import django
django.setup()

from billing.serializers.debtor_import_serializer import DebtorBulkImportSerializer

# Test the serializer with the test CSV file
with open('test_debtors_import.csv', 'rb') as f:
    data = {'file': f}
    serializer = DebtorBulkImportSerializer(data=data)
    
    if serializer.is_valid():
        print('Serializer is valid')
        result = serializer.save()
        print(f'Created {len(result)} debtors')
    else:
        print('Serializer errors:')
        print(serializer.errors)
