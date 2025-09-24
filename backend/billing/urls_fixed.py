from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views.imports import import_debtors

router = DefaultRouter()
router.register(r'invoices', views.InvoiceViewSet)
router.register(r'expenses', views.ExpenseViewSet)
router.register(r'debtors', views.DebtorViewSet)
router.register(r'debtor-payments', views.DebtorPaymentViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'stats', views.BillingStatsViewSet)

urlpatterns = [
    path('debtors/import_excel/', import_debtors, name='import_debtors'),
    path('', include(router.urls)),
]
