from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.categories, name='inventory_categories'),
    path('parts/', views.parts, name='inventory_parts'),
    path('parts/<int:pk>/', views.part_detail, name='inventory_part_detail'),
    path('parts/<int:pk>/history/', views.part_history, name='inventory_part_history'),
    path('assign-to-job/', views.assign_to_job, name='inventory_assign_to_job'),
    path('reorder/', views.reorder_part, name='inventory_reorder'),
    path('export/', views.export_parts_csv, name='inventory_export'),
    path('scan/', views.scan_barcode, name='inventory_scan'),
    path('suppliers/', views.suppliers, name='inventory_suppliers'),
    path('transactions/', views.transactions, name='inventory_transactions'),
    path('customers/', views.customers, name='inventory_customers'),
    path('customers/<int:pk>/', views.customer_detail, name='inventory_customer_detail'),
]
