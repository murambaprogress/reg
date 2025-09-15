from django.contrib import admin
from .models import (
    Invoice, InvoiceItem, Payment, Expense, 
    Debtor, DebtorContact, BillingStats
)


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = ['total_price']


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
        ('Basic Information', {
            'fields': ('invoice_number', 'customer', 'job')
        }),
        ('Vehicle Information', {
            'fields': ('vehicle_model', 'vehicle_plate')
        }),
        ('Service Details', {
            'fields': ('service_description',)
        }),
        ('Financial Details', {
            'fields': (
                'subtotal', 'tax_rate', 'tax_amount', 
                'discount_amount', 'total_amount'
            )
        }),
        ('Payment Information', {
            'fields': ('status', 'payment_method', 'paid_date')
        }),
        ('Dates', {
            'fields': ('invoice_date', 'due_date')
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_by'),
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
        'invoice', 'item_type', 'description', 'quantity', 
        'unit_price', 'total_price'
    ]
    list_filter = ['item_type']
    search_fields = ['description', 'part_number', 'invoice__invoice_number']
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


class DebtorContactInline(admin.TabularInline):
    model = DebtorContact
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Debtor)
class DebtorAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'total_outstanding', 'days_overdue', 
        'last_contact_date', 'contact_attempts', 'status'
    ]
    list_filter = ['status', 'last_contact_date']
    search_fields = ['customer__name', 'customer__phone', 'customer__email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [DebtorContactInline]
    
    actions = ['update_outstanding_amounts']
    
    def update_outstanding_amounts(self, request, queryset):
        for debtor in queryset:
            debtor.update_outstanding_amount()
        self.message_user(request, f"Updated outstanding amounts for {queryset.count()} debtors.")
    update_outstanding_amounts.short_description = "Update outstanding amounts"


@admin.register(DebtorContact)
class DebtorContactAdmin(admin.ModelAdmin):
    list_display = [
        'debtor', 'contact_type', 'contact_date', 'outcome', 'contacted_by'
    ]
    list_filter = ['contact_type', 'outcome', 'contact_date']
    search_fields = [
        'debtor__customer__name', 'notes', 'contacted_by__username'
    ]
    readonly_fields = ['created_at']
    date_hierarchy = 'contact_date'


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
