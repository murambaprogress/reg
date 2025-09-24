from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
import pandas as pd
import csv
from datetime import datetime
from ..models import Debtor, DebtorPayment
from decimal import Decimal
from inventory.models import Customer
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_debtors(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    success_count = 0
    error_count = 0
    errors = []
    debtor_transactions = []

    # Validate file type
    if not file.name.endswith(('.csv', '.xlsx', '.xls')):
        return Response({
            'error': 'Invalid file format',
            'details': 'Please upload a CSV (.csv) or Excel (.xlsx, .xls) file'
        }, status=status.HTTP_400_BAD_REQUEST)

    logger.info(f"Starting debtor import for user {request.user.username}")

    # Read the file
    try:
        if file.name.endswith('.csv'):
            # Try reading with and without headers
            try:
                df = pd.read_csv(file)
                if df.empty:
                    df = pd.read_csv(file, header=None)
            except:
                df = pd.read_csv(file, header=None)
        else:
            # Try reading with and without headers
            try:
                df = pd.read_excel(file)
                if df.empty:
                    df = pd.read_excel(file, header=None)
            except:
                df = pd.read_excel(file, header=None)

        # If we read without headers, assign default column names
        if df.columns.dtype == 'int64':  # numeric column names indicate no header was found
            df.columns = [f'Column_{i}' for i in range(len(df.columns))]
            print("No headers found, using default column names:", list(df.columns))
        else:
            print("Headers found:", list(df.columns))

        if df.empty:
            return Response({
                'error': 'Empty file',
                'details': 'The uploaded file contains no data. Please check the file content.'
            }, status=status.HTTP_400_BAD_REQUEST)

    except pd.errors.EmptyDataError:
        return Response({
            'error': 'Empty file',
            'details': 'The file contains no data or only empty rows'
        }, status=status.HTTP_400_BAD_REQUEST)
    except pd.errors.ParserError as e:
        return Response({
            'error': 'File format error',
            'details': f'Unable to parse the file: {str(e)}. Please ensure the file is properly formatted.'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'File reading error',
            'details': f'Error while reading the file: {str(e)}. Please ensure the file is not corrupted.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Helper function to find matching column
    def find_column(df, possible_names):
        for name in possible_names:
            if name.lower() in [col.lower() for col in df.columns]:
                return next(col for col in df.columns if col.lower() == name.lower())
        return None

    # Process based on format
    try:
        # Debug: Print available columns
        print(f"Available columns in file: {list(df.columns)}")
        
        # Try to find matching columns with various possible names
        customer_col = find_column(df, ['customer_name', 'customer', 'name', 'client', 'debtor', 'Customer Name', 'Customer'])
        amount_col = find_column(df, ['amount', 'balance', 'total', '$', 'value', 'sum', 'Amount', 'Balance', 'Total', 'Value', 'Total Outstanding', 'total_outstanding', 'total outstanding'])

        date_col = find_column(df, ['due_date', 'date', 'payment_date', 'invoice_date', 'Date', 'Due Date', 'Payment Date'])
        desc_col = find_column(df, ['description', 'details', 'notes', 'Details', 'particulars', 'Description', 'Particulars'])
        
        # Debug: Print found columns
        print(f"Found columns - Customer: {customer_col}, Amount: {amount_col}, Date: {date_col}, Description: {desc_col}")
        
        # Debug: Print first few rows
        print("First few rows of data:")
        print(df.head())

        # Validate required columns
        missing_columns = []
        if not customer_col:
            missing_columns.append("Customer name (looking for: 'customer_name', 'customer', 'name', 'client', 'debtor', 'Customer Name')")
        if not amount_col:
            missing_columns.append("Amount (looking for: 'amount', 'balance', 'total', '$', 'value', 'sum', 'Amount')")
        
        if missing_columns:
            return Response({
                'error': 'Missing required columns',
                'details': f"Could not find columns for: {', '.join(missing_columns)}",
                'found_columns': list(df.columns),
                'required_columns': {
                    'customer': ['customer_name', 'customer', 'name', 'client', 'debtor', 'Customer Name'],
                    'amount': ['amount', 'balance', 'total', '$', 'value', 'sum', 'Amount', 'Total Outstanding', 'total_outstanding', 'total outstanding']
                }

            }, status=status.HTTP_400_BAD_REQUEST)

        if customer_col and amount_col:
            # Process rows with customer format using database transaction
            processed_records = 0
            with transaction.atomic():
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
                            # Clean amount string more thoroughly
                            amount_clean = str(amount_str).replace('$', '').replace(',', '').replace(' ', '').strip()
                            try:
                                amount = Decimal(amount_clean)
                            except (ValueError, TypeError):
                                errors.append(f"Row {index + 2}: Invalid amount '{amount_str}', using 0")
                                amount = Decimal('0')
                        
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
                                            logger.warning(f"Could not parse date '{date_str}', using current date")
                                            due_date = datetime.now().date()
                                else:
                                    due_date = datetime.now().date()
                            except Exception as e:
                                logger.warning(f"Date parsing error: {e}")
                                due_date = datetime.now().date()
                        else:
                            due_date = datetime.now().date()
                        
                        # Handle description
                        description = str(row[desc_col]).strip() if desc_col and not pd.isna(row[desc_col]) else ''

                        # Create or get customer with proper error handling
                        try:
                            customer, created = Customer.objects.get_or_create(
                                name=customer_name,
                                defaults={
                                    'phone': '',
                                    'email': '',
                                    'address': ''
                                }
                            )
                            logger.info(f"{'Created' if created else 'Found'} customer: {customer_name}")
                        except Exception as e:
                            logger.error(f"Error creating customer {customer_name}: {e}")
                            errors.append(f"Row {index + 2}: Error creating customer '{customer_name}': {str(e)}")
                            error_count += 1
                            continue
                        
                        # Create debtor record with proper error handling
                        try:
                            debtor = Debtor.objects.create(
                                customer=customer,
                                initial_amount=amount,
                                current_balance=amount,
                                due_date=due_date,
                                description=description or f"Imported debt for {customer_name}",
                                created_by=request.user
                            )
                            logger.info(f"Created debtor record for {customer_name}: ${amount}")
                            success_count += 1
                            processed_records += 1
                            
                            # Add to debtor_transactions for consistency
                            debtor_transactions.append({
                                'customer': customer_name,
                                'amount': amount,
                                'date': due_date,
                                'description': description
                            })
                            
                        except Exception as e:
                            logger.error(f"Error creating debtor for {customer_name}: {e}")
                            errors.append(f"Row {index + 2}: Error creating debtor record: {str(e)}")
                            error_count += 1
                            continue

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error processing row {index + 2}: {e}")
                        errors.append(f"Error in row {index + 2}: {str(e)}")
                        
                logger.info(f"Customer format processing completed: {processed_records} records processed")

        else:
            # Try to identify dual column format
            print("Attempting to process as statement format...")
            
            # Look for typical column patterns in statement format
            date_col = find_column(df, ['Date', 'date', 'transaction_date', 'Trans Date', 'Transaction Date'])
            details_col = find_column(df, ['Details', 'details', 'description', 'particulars', 'Description', 'Particulars'])
            amount_col = find_column(df, ['$', 'amount', 'value', 'debit', 'credit', 'Amount', 'Value', 'Debit', 'Credit'])
            
            print(f"Statement format columns - Date: {date_col}, Details: {details_col}, Amount: {amount_col}")
            
            # Find right side columns if they exist
            right_details_col = None
            right_amount_col = None
            
            # Try to detect right side columns by looking at the actual data
            print("Column names:", list(df.columns))
            # Look for columns that might contain amounts (check if they have numeric values)
            for col in df.columns:
                if col not in [date_col, details_col, amount_col]:
                    # Check if column has any numeric values
                    try:
                        numeric_values = pd.to_numeric(df[col].str.replace('$', '').str.replace(',', ''), errors='coerce')
                        if not numeric_values.isna().all():
                            if right_amount_col is None:
                                right_amount_col = col
                                print(f"Found potential right amount column: {col}")
                    except:
                        # If column can't be converted to numeric, it might be details
                        if right_details_col is None and df[col].notna().any():
                            right_details_col = col
                            print(f"Found potential right details column: {col}")
            
            print(f"Right side columns - Details: {right_details_col}, Amount: {right_amount_col}")
            
            # Check if we have a dual column format by looking at column positions
            if len(df.columns) >= 5:  # Minimum columns for dual format
                col_list = list(df.columns)
                # Try to find right side columns after the main columns
                main_cols_found = False
                for i, col in enumerate(col_list):
                    if col.lower() in ['details', 'particulars', 'description']:
                        main_cols_found = True
                    elif main_cols_found and col.lower() in ['details', 'particulars', 'description']:
                        right_details_col = col
                        # Look for amount column after right details
                        for next_col in col_list[i+1:]:
                            if any(term in next_col.lower() for term in ['$', 'amount', 'value', 'debit', 'credit']):
                                right_amount_col = next_col
                                break
                        break

            # Process dual column format
            for index, row in df.iterrows():
                try:
                    # Process left side
                    if date_col and not pd.isna(row.get(date_col, None)):
                        date_str = str(row[date_col]).strip()
                        if date_str and date_str.lower() != 'nan':
                            print(f"Processing row with date: {date_str}")
                            try:
                                # Try different date formats
                                if '/' in date_str:
                                    date = datetime.strptime(date_str, '%d/%m/%Y').date()
                                else:
                                    date = pd.to_datetime(date_str).date()
                            except ValueError:
                                try:
                                    date = pd.to_datetime(date_str).date()
                                except:
                                    errors.append(f"Invalid date format '{date_str}' in row {index + 2}")
                                    error_count += 1
                                    continue

                            # Get details and amount from left side
                            details = str(row.get(details_col, '')).strip() if not pd.isna(row.get(details_col, None)) else ''
                            amount_left = row.get(amount_col, 0)
                            
                            if not pd.isna(amount_left):
                                try:
                                    # Handle amount string with currency symbols and formatting
                                    amount_str = str(amount_left)
                                    original_amount = amount_str
                                    # Remove currency symbols and spaces
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
                                    
                                    try:
                                        amount_left = Decimal(amount_str)
                                    except:
                                        errors.append(f"Row {index + 2}: Invalid amount format '{original_amount}', using 0")
                                        amount_left = Decimal('0')
                                except:
                                    errors.append(f"Row {index + 2}: Could not process amount '{amount_left}', using 0")
                                    amount_left = Decimal('0')
                            else:
                                errors.append(f"Row {index + 2}: Empty amount, using 0")
                                amount_left = Decimal('0')
                            
                            if details:
                                debtor_transactions.append({
                                    'date': date,
                                    'description': details,
                                    'amount': amount_left,
                                    'side': 'left'
                                })

                            # Process right side (Details, $) - columns 4 and 5
                            right_details_col = df.columns[3] if len(df.columns) > 3 else None
                            right_amount_col = df.columns[4] if len(df.columns) > 4 else None
                            
                            if right_details_col and not pd.isna(row.get(right_details_col, None)):
                                right_details = str(row[right_details_col]).strip()
                                right_amount = row.get(right_amount_col, 0) if right_amount_col else 0
                                
                                if not pd.isna(right_amount) and str(right_amount).strip():
                                    try:
                                        right_amount = Decimal(str(right_amount).replace('$', '').replace(',', '').strip())
                                    except:
                                        right_amount = Decimal('0')
                                else:
                                    right_amount = Decimal('0')
                                
                                if right_details:
                                    debtor_transactions.append({
                                        'date': date,
                                        'description': right_details,
                                        'amount': right_amount,
                                        'side': 'right'
                                    })

                except Exception as e:
                    error_count += 1
                    errors.append(f"Error processing row {index + 2}: {str(e)}")

            # Process transactions into debtor records
            if debtor_transactions:
                with transaction.atomic():
                    try:
                        # Create customer for import
                        customer_name = f"Imported Customer {datetime.now().strftime('%Y%m%d_%H%M%S')}"
                        customer, created = Customer.objects.get_or_create(
                            name=customer_name,
                            defaults={
                                'phone': '',
                                'email': '',
                                'address': ''
                            }
                        )
                        logger.info(f"Created import customer: {customer_name}")
                        
                        # Calculate total amount from transactions
                        total_amount = sum(t['amount'] for t in debtor_transactions)
                        
                        # Create debtor with correct field names
                        current_debtor = Debtor.objects.create(
                            customer=customer,
                            initial_amount=total_amount,
                            current_balance=total_amount,
                            due_date=debtor_transactions[0]['date'],
                            description=f"Imported transactions ({len(debtor_transactions)} items)",
                            created_by=request.user
                        )
                        logger.info(f"Created debtor record with total amount: ${total_amount}")
                        
                        # Create payment records for each transaction
                        for trans_record in debtor_transactions:
                            DebtorPayment.objects.create(
                                debtor=current_debtor,
                                amount_paid=trans_record['amount'],
                                payment_method='bank_transfer',  # Default method
                                payment_date=trans_record['date'],
                                notes=trans_record['description']
                            )
                        
                        success_count = 1
                        logger.info(f"Created {len(debtor_transactions)} payment records")
                        
                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error creating debtor from transactions: {e}")
                        errors.append(f"Error creating debtor: {str(e)}")

        logger.info(f"Import completed: {success_count} success, {error_count} errors")
        return Response({
            'message': 'Import completed',
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors,
            'transactions_processed': len(debtor_transactions)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Import failed with exception: {e}")
        return Response({
            'error': f'Import failed: {str(e)}',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_template(request):
    """
    Generate and download a CSV template for debtor imports
    """
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="debtors_import_template.csv"'
    
    writer = csv.writer(response)
    
    # Write header row with required columns
    writer.writerow([
        'Customer Name',
        'Amount',
        'Due Date',
        'Description'
    ])
    
    # Write example rows with sample data
    writer.writerow([
        'John Doe Motors',
        '1500.00',
        '2024-12-31',
        'Vehicle repair services - Invoice #001'
    ])
    
    writer.writerow([
        'ABC Company Ltd',
        '2750.50',
        '2024-11-15',
        'Parts and labor - Invoice #002'
    ])
    
    writer.writerow([
        'Smith Auto Services',
        '890.25',
        '2024-10-30',
        'Diagnostic and repair work - Invoice #003'
    ])
    
    return response
