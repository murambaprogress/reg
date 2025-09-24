from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Invoice, InvoiceItem, Payment, Expense, 
    Debtor, DebtorPayment, BillingStats
)


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = ['total_price']
    fields = ['code', 'description', 'unit', 'quantity', 'unit_price', 'discount', 'total_price']


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'customer', 'vehicle_model', 'total_amount', 
        'status', 'invoice_date', 'due_date'
    ]
    list_filter = ['status', 'payment_method', 'invoice_date', 'due_date']
    search_fields = [
        'invoice_number', 'customer__name', 'vehicle_model', 
        'vehicle_plate', 'service_description'
    ]
    readonly_fields = ['tax_amount', 'total_amount', 'created_at', 'updated_at']
    inlines = [InvoiceItemInline, PaymentInline]
    date_hierarchy = 'invoice_date'
    
    fieldsets = (
        ('Invoice Information', {
            'fields': (
                'invoice_number', 'invoice_date', 'due_date',
                'order_number', 'delivery_note'
            )
        }),
        ('Customer Information', {
            'fields': (
                'customer', 'contact_person', 'contact_number',
                'delivery_address', 'customer_vat_number'
            )
        }),
        ('Job Details', {
            'fields': (
                'job', 'vehicle_model', 'vehicle_plate'
            )
        }),
        ('Financial Details', {
            'fields': (
                'subtotal', 'tax_rate', 'tax_amount', 
                'discount_amount', 'total_amount'
            )
        }),
        ('Payment Terms', {
            'fields': (
                'payment_terms', 'status'
            )
        }),
        ('Bank Details', {
            'fields': (
                'bank_name', 'bank_account_name', 'bank_branch',
                'bank_account_number', 'bank_branch_code', 'bank_swift_code'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = [
        'invoice', 'code', 'description', 'unit', 'quantity', 
        'unit_price', 'discount', 'total_price'
    ]
    list_filter = ['unit']
    search_fields = ['code', 'description', 'invoice__invoice_number']
    readonly_fields = ['total_price']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'invoice', 'amount', 'payment_method', 'payment_date', 'recorded_by'
    ]
    list_filter = ['payment_method', 'payment_date']
    search_fields = [
        'invoice__invoice_number', 'reference_number', 
        'invoice__customer__name'
    ]
    readonly_fields = ['created_at']
    date_hierarchy = 'payment_date'


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = [
        'expense_id', 'expense_type', 'category', 'vendor', 
        'amount', 'status', 'expense_date'
    ]
    list_filter = [
        'expense_type', 'category', 'status', 'payment_method', 'expense_date'
    ]
    search_fields = [
        'expense_id', 'description', 'vendor', 'related_job__service_description'
    ]
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'expense_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('expense_id', 'expense_type', 'category', 'description', 'vendor')
        }),
        ('Financial Details', {
            'fields': ('amount', 'tax_amount')
        }),
        ('Payment Information', {
            'fields': ('status', 'payment_method', 'paid_date')
        }),
        ('Dates', {
            'fields': ('expense_date', 'due_date')
        }),
        ('Additional Information', {
            'fields': ('receipt_url', 'notes', 'created_by', 'related_job'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


class DebtorPaymentInline(admin.TabularInline):
    model = DebtorPayment
    extra = 1
    readonly_fields = ['created_at']


@admin.register(Debtor)
class DebtorAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'get_debt_amount', 'status', 
        'debt_date', 'due_date', 'get_payment_status'
    ]
    list_filter = ['status', 'debt_date', 'due_date']
    search_fields = ['customer__name', 'customer__phone', 'customer__email', 'description']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [DebtorPaymentInline]
    
    fieldsets = (
        ('Debtor Information', {
            'fields': ('customer', 'invoice', 'status')
        }),
        ('Amount Details', {
            'fields': ('initial_amount', 'current_balance')
        }),
        ('Dates', {
            'fields': ('debt_date', 'due_date')
        }),
        ('Additional Information', {
            'fields': ('description', 'payment_terms', 'notes', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_debt_amount(self, obj):
        return format_html(
            '<span style="color: {}">₦{:.2f} / ₦{:.2f}</span>',
            'red' if obj.current_balance > 0 else 'green',
            obj.current_balance,
            obj.initial_amount
        )
    get_debt_amount.short_description = 'Balance / Initial'

    def get_payment_status(self, obj):
        if obj.current_balance == 0:
            return format_html(
                '<span style="color: green;">✔ Fully Paid</span>'
            )
        percentage = ((obj.initial_amount - obj.current_balance) / obj.initial_amount) * 100
        return format_html(
            '<span style="color: {};">{:.1f}% Paid</span>',
            'orange' if percentage > 0 else 'red',
            percentage
        )
    get_payment_status.short_description = 'Payment Status'


@admin.register(DebtorPayment)
class DebtorPaymentAdmin(admin.ModelAdmin):
    list_display = [
        'debtor', 'amount_paid', 'payment_method', 
        'payment_date', 'reference_number', 'received_by'
    ]
    list_filter = ['payment_method', 'payment_date']
    search_fields = [
        'debtor__customer__name', 'reference_number', 
        'notes', 'received_by__username'
    ]
    readonly_fields = ['created_at']
    date_hierarchy = 'payment_date'


@admin.register(BillingStats)
class BillingStatsAdmin(admin.ModelAdmin):
    list_display = [
        'stat_date', 'total_revenue', 'outstanding_invoices', 
        'total_expenses', 'updated_at'
    ]
    list_filter = ['stat_date']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'stat_date'
    
    fieldsets = (
        ('Date', {
            'fields': ('stat_date',)
        }),
        ('Revenue Statistics', {
            'fields': (
                'total_revenue', 'outstanding_invoices', 
                'paid_this_month', 'avg_invoice_value'
            )
        }),
        ('Business Expense Statistics', {
            'fields': (
                'total_expenses', 'parts_supplies_expenses', 
                'utilities_expenses', 'equipment_expenses'
            )
        }),
        ('Personal Expense Statistics', {
            'fields': (
                'admin_expenses', 'travel_meals_expenses', 
                'office_supplies_expenses', 'professional_dev_expenses'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
