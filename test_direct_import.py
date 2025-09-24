#!/usr/bin/env python
import os
import sys
import django
import pandas as pd
from decimal import Decimal
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append('backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from billing.models import Debtor
from inventory.models import Customer
from api.models import User

def test_simple_format_parsing():
    print("Testing simple debtor format parsing logic...")
    
    # Create a test user
    try:
        user = User.objects.get(username='testuser')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser', 
            email='testuser@example.com',
            password='testpass',
            role='admin'
        )
    
    # Read the CSV file
    df = pd.read_csv('test_simple_debtors_import.csv')
    print(f"Available columns in file: {list(df.columns)}")
    print("First few rows of data:")
    print(df.head())
    
    # Helper function to find matching column
    def find_column(df, possible_names):
        for name in possible_names:
            if name.lower() in [col.lower() for col in df.columns]:
                return next(col for col in df.columns if col.lower() == name.lower())
        return None
    
    # Try to find matching columns with various possible names
    customer_col = find_column(df, ['customer_name', 'customer', 'name', 'client', 'debtor', 'Customer Name', 'Customer'])
    amount_col = find_column(df, ['amount', 'balance', 'total', '$', 'value', 'sum', 'Amount', 'Balance', 'Total', 'Value'])
    date_col = find_column(df, ['due_date', 'date', 'payment_date', 'invoice_date', 'Date', 'Due Date', 'Payment Date'])
    desc_col = find_column(df, ['description', 'details', 'notes', 'Details', 'particulars', 'Description', 'Particulars'])
    
    print(f"Found columns - Customer: {customer_col}, Amount: {amount_col}, Date: {date_col}, Description: {desc_col}")
    
    if not customer_col or not amount_col:
        print("❌ Missing required columns!")
        return False
    
    # Clear existing test data
    Debtor.objects.filter(customer__name__in=['John Doe', 'Jane Smith', 'Bob Johnson']).delete()
    Customer.objects.filter(name__in=['John Doe', 'Jane Smith', 'Bob Johnson']).delete()
    
    success_count = 0
    errors = []
    
    # Process rows with customer format
    for index, row in df.iterrows():
        try:
            customer_name = str(row[customer_col]).strip()
            if pd.isna(customer_name) or customer_name.lower() == 'nan':
                errors.append(f"Row {index + 2}: Empty customer name, skipping")
                continue
                
            # Handle amount
            amount_str = str(row[amount_col])
            if pd.isna(amount_str) or amount_str.strip() == '':
                amount = Decimal('0')
            else:
                amount = Decimal(str(amount_str).replace('$', '').replace(',', '').strip())
            
            # Handle date - improved parsing for various formats
            if date_col and not pd.isna(row[date_col]):
                try:
                    date_str = str(row[date_col]).strip()
                    if date_str and date_str.lower() != 'nan':
                        # Try different date formats
                        try:
                            # Handle datetime strings like "23/9/2025 18:19"
                            if ' ' in date_str:
                                date_str = date_str.split(' ')[0]  # Take only the date part
                            
                            # Try DD/MM/YYYY format first
                            if '/' in date_str:
                                parts = date_str.split('/')
                                if len(parts) == 3:
                                    day, month, year = parts
                                    due_date = datetime(int(year), int(month), int(day)).date()
                                else:
                                    due_date = pd.to_datetime(date_str).date()
                            else:
                                due_date = pd.to_datetime(date_str).date()
                        except ValueError:
                            try:
                                # Try pandas parsing as fallback
                                due_date = pd.to_datetime(date_str, dayfirst=True).date()
                            except:
                                print(f"Could not parse date '{date_str}', using current date")
                                due_date = datetime.now().date()
                    else:
                        due_date = datetime.now().date()
                except Exception as e:
                    print(f"Date parsing error: {e}")
                    due_date = datetime.now().date()
            else:
                due_date = datetime.now().date()
            
            # Handle description
            description = str(row[desc_col]).strip() if desc_col and not pd.isna(row[desc_col]) else ''

            print(f"Processing: {customer_name}, ${amount}, {due_date}, '{description}'")

            # Create or get customer
            customer, created = Customer.objects.get_or_create(name=customer_name)
            if created:
                print(f"  Created new customer: {customer_name}")
            
            # Create debtor record
            debtor = Debtor.objects.create(
                customer=customer,
                initial_amount=amount,
                current_balance=amount,
                due_date=due_date,
                description=description,
                created_by=user
            )
            print(f"  Created debtor record: ID {debtor.id}")

            success_count += 1
        except Exception as e:
            errors.append(f"Error in row {index + 2}: {str(e)}")
            print(f"  Error: {str(e)}")
    
    print(f"\nProcessing complete:")
    print(f"Success count: {success_count}")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print(f"  - {error}")
    
    # Check if debtors were created
    debtors = Debtor.objects.filter(customer__name__in=['John Doe', 'Jane Smith', 'Bob Johnson'])
    print(f"\nCreated {debtors.count()} debtors:")
    
    for debtor in debtors:
        print(f"  - {debtor.customer.name}: ${debtor.current_balance} due {debtor.due_date}")
        print(f"    Description: {debtor.description}")
    
    return success_count > 0

if __name__ == '__main__':
    success = test_simple_format_parsing()
    if success:
        print("\n✅ Test passed! Simple import format parsing is working.")
    else:
        print("\n❌ Test failed! There are still issues with the parsing logic.")
