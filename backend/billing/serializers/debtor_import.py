from rest_framework import serializers
from .models import Debtor
from inventory.models import Customer
import pandas as pd
from django.db import transaction

class DebtorBulkImportSerializer(serializers.Serializer):
    file = serializers.FileField()
    
    def validate_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError(
                "Only CSV files are supported. Please save your file as CSV."
            )
        return value

    def create(self, validated_data):
        file_obj = validated_data['file']
        created_debtors = []
        
        try:
            df = pd.read_csv(file_obj)
            
            required_columns = ['customer_name', 'amount', 'due_date', 'description']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise serializers.ValidationError(
                    f"Missing required columns: {', '.join(missing_columns)}"
                )
            
            with transaction.atomic():
                for _, row in df.iterrows():
                    # Get or create customer with just the name
                    customer, _ = Customer.objects.get_or_create(
                        name=row['customer_name']
                    )
                    
                    # Create debtor record with basic fields
                    debtor = Debtor.objects.create(
                        customer=customer,
                        initial_amount=row['amount'],
                        current_balance=row['amount'],
                        due_date=pd.to_datetime(row['due_date']).date(),
                        description=row['description'],
                        created_by=self.context['request'].user
                    )
                    created_debtors.append(debtor)
                    
            return created_debtors
            
        except pd.errors.EmptyDataError:
            raise serializers.ValidationError("The uploaded file is empty.")
        except pd.errors.ParserError:
            raise serializers.ValidationError("Invalid CSV file format. Please check your file.")
        except Exception as e:
            raise serializers.ValidationError(f"Error processing file: {str(e)}")

    class Meta:
        fields = ['file']