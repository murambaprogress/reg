from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
import pandas as pd
import io
from ..models import Debtor
from inventory.models import Customer


class DebtorBulkImportSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        if not value.name.endswith(('.csv', '.xlsx', '.xls')):
            raise serializers.ValidationError('Only CSV and Excel files are supported.')
        return value


    def create(self, validated_data):
        file_obj = validated_data['file']
        created_by = validated_data.get('created_by')
        created_debtors = []

        # Read CSV file
        try:
            content = file_obj.read().decode('utf-8')
            df = pd.read_csv(io.StringIO(content))
        except Exception as e:
            raise serializers.ValidationError(f'Error reading CSV file: {str(e)}')

        # Validate required columns - support multiple column name variations
        column_mapping = {
            'customer_name': ['customer_name', 'customer name', 'name', 'Customer Name', 'Customer'],
            'amount': ['amount', 'total_outstanding', 'total outstanding', 'Total Outstanding', 'balance', 'Balance'],
            'due_date': ['due_date', 'due date', 'Due Date', 'date', 'Date'],
            'description': ['description', 'Description', 'notes', 'Notes']
        }
        
        # Find actual column names in the dataframe
        actual_columns = {col.lower(): col for col in df.columns}
        mapped_columns = {}
        
        for target_col, possible_names in column_mapping.items():
            found = False
            for name in possible_names:
                if name.lower() in actual_columns:
                    mapped_columns[target_col] = actual_columns[name.lower()]
                    found = True
                    break
            if not found:
                raise serializers.ValidationError(
                    f'Missing required column. Could not find any of: {", ".join(possible_names)}'
                )


        # Process rows
        with transaction.atomic():
            for _, row in df.iterrows():
                try:
                    # Get values using mapped column names
                    customer_name = str(row[mapped_columns['customer_name']]).strip()
                    if not customer_name or customer_name.lower() == 'nan':
                        continue  # Skip rows with empty customer names
                    
                    amount_value = row[mapped_columns['amount']]
                    if pd.isna(amount_value) or str(amount_value).strip() == '':
                        amount_value = 0
                    else:
                        # Handle amount string with currency symbols and formatting
                        amount_str = str(amount_value)
                        amount_str = ''.join(c for c in amount_str if c.isdigit() or c in '.-,')
                        # Handle different decimal separators
                        if ',' in amount_str and '.' in amount_str:
                            if amount_str.rindex(',') > amount_str.rindex('.'):
                                amount_str = amount_str.replace('.', '')  # European format
                                amount_str = amount_str.replace(',', '.')
                            else:
                                amount_str = amount_str.replace(',', '')  # US format
                        elif ',' in amount_str and not '.' in amount_str:
                            amount_str = amount_str.replace(',', '.')  # Assume European format
                        amount_value = float(amount_str)

                    # Handle due date - use current date + 30 days if not provided
                    due_date_value = row.get(mapped_columns['due_date'])
                    if pd.isna(due_date_value) or str(due_date_value).strip() == '':
                        due_date = timezone.now().date() + timezone.timedelta(days=30)
                    else:
                        try:
                            due_date = pd.to_datetime(due_date_value).date()
                        except:
                            due_date = timezone.now().date() + timezone.timedelta(days=30)

                    # Handle description
                    description_value = row.get(mapped_columns['description'], '')
                    if pd.isna(description_value) or str(description_value).strip() == '':
                        description = f"Imported debtor for {customer_name}"
                    else:
                        description = str(description_value).strip()

                    # Create or get customer
                    customer, _ = Customer.objects.get_or_create(
                        name=customer_name
                    )

                    # Create debtor record
                    debtor = Debtor.objects.create(
                        customer=customer,
                        initial_amount=amount_value,
                        current_balance=amount_value,
                        due_date=due_date,
                        description=description,
                        created_by=created_by
                    )
                    created_debtors.append(debtor)

                except Exception as e:
                    raise serializers.ValidationError(
                        f'Error processing row for {customer_name if "customer_name" in locals() else "unknown"}: {str(e)}'
                    )


        return created_debtors
