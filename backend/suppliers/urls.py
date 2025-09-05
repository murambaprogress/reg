from django.urls import path
from . import views

urlpatterns = [
    path('', views.suppliers_list, name='suppliers_list'),
    path('<int:pk>/', views.supplier_detail, name='supplier_detail'),
]
