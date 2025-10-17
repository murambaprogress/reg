"""
Comprehensive fix script for PythonAnywhere deployment
This script addresses both database issues and authentication/CSRF problems

Run this script on PythonAnywhere using:
python manage.py shell < fix_deployment_issues.py
"""

import os
import sys
import django
from django.db import connection
from django.conf import settings

def print_header(title):
    print("\n" + "=" * 50)
    print(title)
    print("=" * 50)

def fix_database_issues():
    print_header("DATABASE SCHEMA FIXES")
    
    # Define tables and columns to check/add
    tables_to_check = {
        'billing_debtorpayment': [
            ('id', 'bigint NOT NULL AUTO_INCREMENT PRIMARY KEY'),
            ('amount_paid', 'decimal(12,2) NOT NULL'),
            ('payment_method', 'varchar(20) NOT NULL'),
            ('payment_date', 'date NOT NULL'),
            ('reference_number', 'varchar(100) DEFAULT ""'),
            ('notes', 'longtext DEFAULT ""'),
            ('created_at', 'datetime(6) NOT NULL'),
            ('debtor_id', 'bigint NOT NULL'),
            ('received_by_id', 'bigint NULL'),
        ],
        'billing_debtor': [
            ('id', 'bigint NOT NULL AUTO_INCREMENT PRIMARY KEY'),
            ('total_outstanding', 'decimal(12,2) DEFAULT 0.00'),
            ('oldest_invoice_date', 'date NULL'),
            ('days_overdue', 'int DEFAULT 0'),
            ('last_contact_date', 'date NULL'),
            ('contact_attempts', 'int DEFAULT 0'),
            ('status', 'varchar(50) DEFAULT "active"'),
            ('notes', 'longtext DEFAULT ""'),
            ('created_at', 'datetime(6) NOT NULL'),
            ('updated_at', 'datetime(6) NOT NULL'),
            ('customer_id', 'bigint NULL'),
            ('invoice_id', 'bigint NULL'),
            ('initial_amount', 'decimal(12,2) DEFAULT 0.00'),
            ('current_balance', 'decimal(12,2) DEFAULT 0.00'),
            ('debt_date', 'date NULL'),
            ('due_date', 'date NULL'),
            ('description', 'longtext DEFAULT ""'),
            ('payment_terms', 'int DEFAULT 30'),
            ('created_by_id', 'bigint NULL'),
        ]
    }
    
    # Check each table
    for table_name, columns in tables_to_check.items():
        print(f"\nChecking table: {table_name}")
        
        # Check if table exists
        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                AND table_name = '{table_name}';
            """)
            table_exists = cursor.fetchone()[0] > 0
        
        if not table_exists:
            print(f"  Table {table_name} doesn't exist. Creating it...")
            # Create the table with all columns
            column_definitions = ', '.join([f"{col} {definition}" for col, definition in columns])
            with connection.cursor() as cursor:
                cursor.execute(f"CREATE TABLE {table_name} ({column_definitions});")
            print(f"  Table {table_name} created.")
        else:
            print(f"  Table {table_name} exists. Checking columns...")
            
            # Check each column
            for column_name, definition in columns:
                with connection.cursor() as cursor:
                    cursor.execute(f"""
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                        AND table_name = '{table_name}'
                        AND column_name = '{column_name}';
                    """)
                    column_exists = cursor.fetchone()[0] > 0
                
                if not column_exists:
                    print(f"    Adding missing column: {column_name}")
                    with connection.cursor() as cursor:
                        try:
                            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition};")
                            print(f"    Column {column_name} added successfully.")
                        except Exception as e:
                            print(f"    Error adding column {column_name}: {e}")
                else:
                    print(f"    Column {column_name} already exists.")
    
    # Display current table structures
    for table_name in tables_to_check.keys():
        print(f"\nCurrent structure of {table_name}:")
        with connection.cursor() as cursor:
            cursor.execute(f"DESCRIBE {table_name};")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  - {col[0]}: {col[1]}")

def check_auth_settings():
    print_header("AUTHENTICATION & CSRF SETTINGS")
    
    # Check CSRF settings
    print("CSRF Settings:")
    print(f"  CSRF_COOKIE_SECURE: {getattr(settings, 'CSRF_COOKIE_SECURE', False)}")
    print(f"  CSRF_USE_SESSIONS: {getattr(settings, 'CSRF_USE_SESSIONS', False)}")
    
    # Check CSRF trusted origins
    print("\nCSRF Trusted Origins:")
    csrf_origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
    if csrf_origins:
        for origin in csrf_origins:
            print(f"  - {origin}")
    else:
        print("  None configured")
    
    # Check CSRF exempt URLs
    print("\nCSRF Exempt URLs:")
    csrf_exempt = getattr(settings, 'CSRF_EXEMPT_URLS', [])
    if csrf_exempt:
        for url in csrf_exempt:
            print(f"  - {url}")
    else:
        print("  None configured")
    
    # Check DRF authentication classes
    print("\nDRF Authentication Classes:")
    if hasattr(settings, 'REST_FRAMEWORK'):
        auth_classes = settings.REST_FRAMEWORK.get('DEFAULT_AUTHENTICATION_CLASSES', [])
        if auth_classes:
            for cls in auth_classes:
                print(f"  - {cls}")
        else:
            print("  None configured")
    else:
        print("  REST_FRAMEWORK not configured")
    
    # Check CORS settings
    print("\nCORS Settings:")
    print(f"  CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)}")
    print(f"  CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', False)}")
    
    cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    if cors_origins:
        print("\nCORS Allowed Origins:")
        for origin in cors_origins:
            print(f"  - {origin}")

def check_api_endpoints():
    print_header("API ENDPOINT CHECK")
    from django.urls import get_resolver
    
    resolver = get_resolver()
    
    # Check auth-related endpoints
    auth_endpoints = []
    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'url_patterns'):
            # This is an included URLconf
            for sub_pattern in pattern.url_patterns:
                url = str(sub_pattern.pattern)
                if 'auth' in url or 'login' in url or 'register' in url or 'technician' in url:
                    view_name = sub_pattern.callback.__name__ if hasattr(sub_pattern, 'callback') else str(sub_pattern.name)
                    auth_endpoints.append((url, view_name))
        else:
            # This is a direct URL pattern
            url = str(pattern.pattern)
            if 'auth' in url or 'login' in url or 'register' in url or 'technician' in url:
                view_name = pattern.callback.__name__ if hasattr(pattern, 'callback') else str(pattern.name)
                auth_endpoints.append((url, view_name))
    
    print("Authentication-related endpoints:")
    for url, view_name in auth_endpoints:
        print(f"  - {url} -> {view_name}")

if __name__ == '__main__':
    print("\nStarting deployment issue fix script...\n")
    
    # Fix database issues
    fix_database_issues()
    
    # Check authentication settings
    check_auth_settings()
    
    # Check API endpoints
    check_api_endpoints()
    
    print("\nScript completed. Remember to reload your web application!\n")