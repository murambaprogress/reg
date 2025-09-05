from django.urls import path
from . import views

urlpatterns = [
    path('', views.sales_list, name='sales_list'),
    path('<int:pk>/', views.sale_detail, name='sale_detail'),
    path('by-customer/<int:customer_id>/', views.customer_sales, name='customer_sales'),
    path('stats/', views.sales_stats, name='sales_stats'),
    path('items/', views.sale_items, name='sale_items'),
]
