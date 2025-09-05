import React, { useState } from 'react';
import { useSuppliers } from '../SupplierContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const AddSupplierModal = ({ isOpen, onClose }) => {
  const { suppliers, createSupplier } = useSuppliers();
  const [form, setForm] = useState({
    name: '',
    contact: '',
    phone: '',
    amount: '',
    dueDate: '',
    state: 'due',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    createSupplier({
  name: form.name,
  contact: form.contact,
  phone: form.phone,
  amount: Number(form.amount || 0),
  dueDate: form.dueDate || null,
  state: form.state,
  productsSupplied: [],
  previous: [],
  future: [],
  payments: [],
    }).then(() => {
      setForm({ name: '', contact: '', phone: '', amount: '', dueDate: '', state: 'due' });
      setSubmitting(false);
      onClose();
    }).catch(() => {
      setSubmitting(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-surface rounded-lg shadow-xl p-8 w-full max-w-md border border-border">
        <h2 className="text-xl font-heading-semibold mb-4">Add Supplier</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" label="Name" value={form.name} onChange={handleChange} required autoFocus />
          <Input name="contact" label="Contact Person" value={form.contact} onChange={handleChange} required />
          <Input name="phone" label="Phone" value={form.phone} onChange={handleChange} required />
          <Input name="amount" label="Amount" type="number" value={form.amount} onChange={handleChange} required min={0} />
          <Input name="dueDate" label="Due Date" type="date" value={form.dueDate} onChange={handleChange} required />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={submitting} className="flex-1">{submitting ? 'Adding...' : 'Add Supplier'}</Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplierModal;
