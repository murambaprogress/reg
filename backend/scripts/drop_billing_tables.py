import mysql.connector

def drop_billing_tables():
    tables = [
        'billing_debtorcontact',
        'billing_debtorpayment',
        'billing_invoiceitem',
        'billing_payment',
        'billing_expense',
        'billing_invoice',
        'billing_debtor',
        'billing_billingstats'
    ]
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='regimark_motors'
        )
        cursor = conn.cursor()
        
        # Disable foreign key checks
        cursor.execute('SET FOREIGN_KEY_CHECKS = 0')
        
        # Drop each table
        for table in tables:
            try:
                cursor.execute(f'DROP TABLE IF EXISTS {table}')
                print(f'Dropped table {table}')
            except Exception as e:
                print(f'Error dropping {table}: {e}')
        
        # Re-enable foreign key checks
        cursor.execute('SET FOREIGN_KEY_CHECKS = 1')
        
        conn.commit()
        
    except Exception as e:
        print(f'Error: {e}')
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()
            print('Database connection closed.')

if __name__ == '__main__':
    drop_billing_tables()