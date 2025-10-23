"""
Script to fix missing DebtorPayment table in database
Run this on the PythonAnywhere server to create the missing table

Usage:
    python fix_missing_debtorpayment_table.py
"""
import os
import django
from django.db import connection

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

def create_debtorpayment_table():
    print("Creating missing DebtorPayment table...")
    
    # SQL to create the missing table based on the Django model
    sql = """
    CREATE TABLE IF NOT EXISTS `billing_debtorpayment` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `amount_paid` decimal(12,2) NOT NULL,
        `payment_method` varchar(20) NOT NULL,
        `payment_date` date NOT NULL,
        `reference_number` varchar(100) NOT NULL,
        `notes` longtext NOT NULL,
        `created_at` datetime(6) NOT NULL,
        `debtor_id` int(11) NOT NULL,
        `received_by_id` int(11) DEFAULT NULL,
        PRIMARY KEY (`id`),
        KEY `billing_debtorpayment_debtor_id_d9a3e8a3_fk_billing_debtor_id` (`debtor_id`),
        KEY `billing_debtorpayment_received_by_id_106f7b64_fk_auth_user_id` (`received_by_id`),
        CONSTRAINT `billing_debtorpayment_debtor_id_d9a3e8a3_fk_billing_debtor_id` FOREIGN KEY (`debtor_id`) REFERENCES `billing_debtor` (`id`),
        CONSTRAINT `billing_debtorpayment_received_by_id_106f7b64_fk_auth_user_id` FOREIGN KEY (`received_by_id`) REFERENCES `auth_user` (`id`)
    );
    """
    
    with connection.cursor() as cursor:
        cursor.execute(sql)
    
    print("DebtorPayment table created successfully")

def check_table_exists():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name = 'billing_debtorpayment';
        """)
        return cursor.fetchone()[0] > 0

if __name__ == "__main__":
    if check_table_exists():
        print("The billing_debtorpayment table already exists. No action needed.")
    else:
        create_debtorpayment_table()
        if check_table_exists():
            print("Table created successfully and verified!")
        else:
            print("WARNING: Table creation failed or couldn't be verified.")