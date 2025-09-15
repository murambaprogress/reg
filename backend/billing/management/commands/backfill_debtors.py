from django.core.management.base import BaseCommand
from django.db import models, transaction
from django.utils import timezone

from billing.models import Invoice, Debtor


class Command(BaseCommand):
    help = "Backfill Debtor records from existing invoices (includes draft, sent, overdue)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true', help='Show what would happen without writing changes.'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        unpaid_statuses = {'draft', 'sent', 'overdue'}

        invoices = Invoice.objects.filter(status__in=unpaid_statuses).select_related('customer')
        customers = {}
        for inv in invoices:
            customers.setdefault(inv.customer_id, []).append(inv)

        created = 0
        updated = 0
        with transaction.atomic():
            for customer_id, inv_list in customers.items():
                total_outstanding = sum([inv.total_amount for inv in inv_list])
                oldest_invoice_date = min([inv.invoice_date for inv in inv_list]) if inv_list else None
                earliest_due = min([inv.due_date for inv in inv_list]) if inv_list else None

                debtor, was_created = Debtor.objects.get_or_create(customer_id=customer_id)

                debtor.total_outstanding = total_outstanding
                debtor.oldest_invoice_date = oldest_invoice_date
                if earliest_due:
                    debtor.days_overdue = max((timezone.now().date() - earliest_due).days, 0)
                else:
                    debtor.days_overdue = 0

                # Status logic replicating signal
                if total_outstanding > 0:
                    if earliest_due and earliest_due < timezone.now().date():
                        debtor.status = 'overdue'
                    else:
                        debtor.status = 'due'
                else:
                    debtor.status = 'paid'

                action = 'skip'
                if dry_run:
                    action = 'would-create' if was_created else 'would-update'
                else:
                    debtor.save()
                    if was_created:
                        created += 1
                        action = 'created'
                    else:
                        updated += 1
                        action = 'updated'

                self.stdout.write(
                    f"Customer {debtor.customer.name}: outstanding={debtor.total_outstanding} status={debtor.status} ({action})"
                )

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"Backfill complete. Created {created} debtors, updated {updated} debtors."
            ))
        else:
            self.stdout.write(self.style.WARNING("Dry-run complete. No changes written."))