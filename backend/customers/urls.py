from django.urls import path
from . import views

urlpatterns = [
    path('', views.customers, name='customers_list'),
    path('<int:pk>/', views.customer_detail, name='customers_detail'),
    path('search/', views.customer_search, name='customers_search'),
]
