import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { recordDebtorPayment } from '../../../api/billing';
import { Modal, Button, TextInput, TextArea, DateInput, Select } from '@/components/ui';
import { formatCurrency } from '@/utils/formatters';

export const DebtorPaymentDialog = ({ isOpen, onClose, debtor, onPaymentRecorded }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
    },
  });

  const paymentMutation = useMutation(
    (data) => recordDebtorPayment(debtor.id, data),
    {
      onSuccess: () => {
        onPaymentRecorded();
      },
    }
  );

  const handleFormSubmit = async (data) => {
    try {
      await paymentMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const amountPaid = watch('amount_paid') || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium">Customer</label>
            <p>{debtor.customer_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Outstanding Balance</label>
            <p className="text-red-600 font-semibold">
              {formatCurrency(debtor.current_balance)}
            </p>
          </div>
        </div>

        <TextInput
          label="Amount Paid"
          type="number"
          step="0.01"
          {...register('amount_paid', {
            required: 'Amount is required',
            min: { value: 0, message: 'Amount must be positive' },
            max: {
              value: debtor.current_balance,
              message: 'Amount cannot exceed outstanding balance',
            },
          })}
          error={errors.amount_paid?.message}
        />

        {amountPaid > 0 && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm">
              Remaining balance after payment:{' '}
              <span className="font-semibold">
                {formatCurrency(debtor.current_balance - amountPaid)}
              </span>
            </p>
          </div>
        )}

        <Select
          label="Payment Method"
          {...register('payment_method', {
            required: 'Payment method is required',
          })}
          error={errors.payment_method?.message}
        >
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="check">Check</option>
          <option value="mobile_money">Mobile Money</option>
        </Select>

        <TextInput
          label="Reference Number"
          {...register('reference_number')}
          placeholder="Receipt or transaction reference number"
        />

        <DateInput
          label="Payment Date"
          {...register('payment_date', {
            required: 'Payment date is required',
          })}
          error={errors.payment_date?.message}
        />

        <TextArea
          label="Notes"
          {...register('notes')}
          placeholder="Additional notes about the payment"
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={paymentMutation.isLoading}
            disabled={paymentMutation.isLoading}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
