import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { createDebtor } from '@/api/billing';
import { Button, TextInput, TextArea, DateInput, Select } from '@/components/ui';
import { CustomerSearchInput } from '@/components/shared/CustomerSearchInput';

export const DebtorForm = ({ onSubmit, onCancel }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm();

  const createMutation = useMutation(createDebtor, {
    onSuccess: () => {
      queryClient.invalidateQueries('debtors');
      onSubmit();
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating debtor:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <CustomerSearchInput
        onChange={(customer) => {
          setValue('customer', customer.id);
          setValue('customer_name', customer.name);
        }}
      />

      <TextInput
        label="Initial Amount"
        type="number"
        step="0.01"
        {...register('initial_amount', {
          required: 'Initial amount is required',
          min: { value: 0, message: 'Amount must be positive' },
        })}
        error={errors.initial_amount?.message}
      />

      <DateInput
        label="Due Date"
        {...register('due_date', {
          required: 'Due date is required',
        })}
        error={errors.due_date?.message}
      />

      <Select
        label="Status"
        {...register('status')}
        defaultValue="active"
      >
        <option value="active">Active</option>
        <option value="payment_plan">Payment Plan</option>
        <option value="defaulted">Defaulted</option>
      </Select>

      <TextArea
        label="Description"
        {...register('description', {
          required: 'Description is required',
        })}
        error={errors.description?.message}
        placeholder="Describe the goods or services provided"
      />

      <TextArea
        label="Payment Terms"
        {...register('payment_terms')}
        placeholder="Enter agreed payment terms and conditions"
      />

      <TextArea
        label="Notes"
        {...register('notes')}
        placeholder="Additional notes or comments"
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={createMutation.isLoading}
          disabled={createMutation.isLoading}
        >
          Add Debtor
        </Button>
      </div>
    </form>
  );
};