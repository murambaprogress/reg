# How to Fix Missing DebtorPayment Table

You're encountering this error: 
```
File "/usr/local/lib/python3.13/site-packages/MySQLdb/connections.py", line 265, in query
    _mysql.connection.query(self, query)
    ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^
django.db.utils.ProgrammingError: (1146, "Table 'Progress$regimark_motors.billing_debtorpayment' doesn't exist")
```

This error occurs because the `billing_debtorpayment` table is missing in your PythonAnywhere database. Here are two ways to fix it:

## Option 1: Using Django Migration System (Recommended)

1. Log into your PythonAnywhere dashboard

2. Open a Bash console for your account

3. Navigate to your project directory:
   ```bash
   cd regimark_motors_control_center
   ```

4. Create a new migration file:
   ```bash
   cd backend
   python manage.py makemigrations billing --empty --name create_missing_debtorpayment
   ```

5. Open the newly created migration file (should be in `billing/migrations/`) and replace its content with:
   ```python
   from django.db import migrations, models
   import django.db.models.deletion
   
   class Migration(migrations.Migration):
       dependencies = [
           ('billing', '0004_add_item_type_and_part_number'),
       ]
       
       operations = [
           migrations.CreateModel(
               name='DebtorPayment',
               fields=[
                   ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                   ('amount_paid', models.DecimalField(decimal_places=2, max_digits=12)),
                   ('payment_method', models.CharField(choices=[('cash', 'Cash'), ('bank_transfer', 'Bank Transfer'), ('check', 'Check'), ('mobile_money', 'Mobile Money')], max_length=20)),
                   ('payment_date', models.DateField()),
                   ('reference_number', models.CharField(blank=True, help_text='Payment reference number or receipt number', max_length=100)),
                   ('notes', models.TextField(blank=True)),
                   ('created_at', models.DateTimeField(auto_now_add=True)),
                   ('debtor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='billing.debtor')),
                   ('received_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='auth.user')),
               ],
           ),
       ]
   ```

6. Apply the migration:
   ```bash
   python manage.py migrate billing
   ```

## Option 2: Direct SQL Approach

1. Log into your PythonAnywhere dashboard

2. Open a Bash console for your account

3. Navigate to your project directory and run the Python script provided:
   ```bash
   cd regimark_motors_control_center/backend
   python fix_missing_debtorpayment_table.py
   ```

## Option 3: Using MySQL Console

If you prefer direct database access:

1. Open your MySQL console on PythonAnywhere
2. Select your database:
   ```sql
   USE Progress$regimark_motors;
   ```
3. Create the table:
   ```sql
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
   ```

After applying any of these solutions, restart your web application on PythonAnywhere to make sure the changes take effect.