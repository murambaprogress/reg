from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Invoice, Debtor
from django.db import models
from django.db import transaction
from django.utils import timezone

@receiver(post_save, sender=Invoice)
def update_debtor_on_invoice_save(sender, instance: Invoice, created, **kwargs):
    """Maintain Debtor records automatically.
    Rules:
    - If an invoice is unpaid (status in sent, overdue) ensure a Debtor exists.
    - If invoice transitions to paid or cancelled and customer has no more unpaid invoices, remove Debtor.
    - Always refresh total_outstanding and oldest_invoice_date.
    """
    # Treat draft invoices as contributing to debtor tracking per requirement
    unpaid_statuses = {'sent', 'overdue', 'draft'}

    # Use a transaction to keep consistency if multiple invoices saved in a batch
    with transaction.atomic():
        customer = instance.customer
        debtor, _ = Debtor.objects.get_or_create(customer=customer)

        # Recompute outstanding using current unpaid (including draft) invoices
        qs_unpaid = customer.invoices.filter(status__in=unpaid_statuses)
        total_outstanding = qs_unpaid.aggregate(total=models.Sum('total_amount'))['total'] or 0
        debtor.total_outstanding = total_outstanding
        # Oldest invoice date for reference
        oldest_invoice = qs_unpaid.order_by('invoice_date').values_list('invoice_date', flat=True).first()
        debtor.oldest_invoice_date = oldest_invoice
        # Determine earliest due_date among unpaid invoices
        earliest_due = qs_unpaid.order_by('due_date').values_list('due_date', flat=True).first()
        if earliest_due:
            debtor.days_overdue = max((timezone.now().date() - earliest_due).days, 0)
        else:
            debtor.days_overdue = 0

        # Status logic:
        if total_outstanding > 0:
            if earliest_due and earliest_due < timezone.now().date():
                debtor.status = 'overdue'
            else:
                debtor.status = 'due'
        else:
            debtor.status = 'paid'

        debtor.save()
