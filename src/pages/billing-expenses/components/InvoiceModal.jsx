import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useBilling } from '../BillingContext';

const InvoiceModal = ({ isOpen, onClose, invoice = null, mode = 'create' }) => {
  const { createInvoice, updateInvoice, loading } = useBilling();
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer: '',
    job: '',
    vehicle_model: '',
    vehicle_plate: '',
    service_description: '',
    subtotal: '',
    tax_rate: '15',
    discount_amount: '0',
    due_date: '',
    notes: '',
    items: [
      { item_type: 'service', description: '', quantity: '1', unit_price: '', part_number: '' }
    ]
  });
  const [isCustomerLocked, setIsCustomerLocked] = useState(false);
  const [errors, setErrors] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };
  };

  // Load customers/jobs when opening
  useEffect(() => { if (isOpen) { fetchCustomers(); fetchJobs(); } }, [isOpen]);

  // Populate for edit/create
  useEffect(() => {
    if (!isOpen) return;
  if (invoice && mode === 'edit') {
      setFormData(prev => ({
        ...prev,
        invoice_number: invoice.invoice_number || prev.invoice_number,
        customer: invoice.customer || '',
        job: invoice.job || '',
        vehicle_model: invoice.vehicle_model || '',
        vehicle_plate: invoice.vehicle_plate || '',
        service_description: invoice.service_description || '',
        subtotal: invoice.subtotal || '',
        tax_rate: invoice.tax_rate || '15',
        discount_amount: invoice.discount_amount || '0',
        due_date: invoice.due_date || prev.due_date,
        notes: invoice.notes || prev.notes,
        items: invoice.items && invoice.items.length > 0 ? invoice.items.map(item => ({
          item_type: item.item_type || 'service',
          description: item.description || '',
          quantity: String(item.quantity || '1'),
          unit_price: String(item.unit_price || ''),
          part_number: item.part_number || ''
        })) : prev.items
      }));
      setIsCustomerLocked(!!invoice.job); // lock if existing invoice tied to job
    } else if (mode === 'create') {
      setFormData(prev => ({
        ...prev,
        invoice_number: prev.invoice_number || `INV-${Date.now()}`,
        due_date: prev.due_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      }));
    }
  }, [invoice, mode, isOpen]);

  const fetchCustomers = async () => {
    try { const r = await fetch(`${API_BASE_URL}/inventory/customers/`, { headers: getAuthHeaders() }); if (r.ok) { const d = await r.json(); setCustomers(d.results || d); } } catch(e){ console.error('Error fetching customers:', e); }
  };
  const fetchJobs = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/jobs/`, { headers: getAuthHeaders() });
      if (!resp.ok) {
        console.error('Jobs fetch failed', resp.status, resp.statusText);
        return;
      }
      const data = await resp.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      const normalized = list.map(j => ({
        ...j,
        service_description: j.service_description || j.serviceDescription,
        vehicle_model: j.vehicle_model || j.vehicleModel,
        vehicle_plate: j.vehicle_plate || j.vehiclePlate,
        estimated_cost: j.estimated_cost || j.estimatedCost,
  // Prefer explicit customer_id from backend JobListSerializer
  customer: j.customer_id || (j.customer && (j.customer.id || j.customer)) || j.customerId || ''
      }));
      setJobs(normalized);
    } catch (e) {
      console.error('Error fetching jobs:', e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'job') {
      if (value) {
        setIsCustomerLocked(true);
      } else {
        setIsCustomerLocked(false);
      }
    }
    if (name === 'job' && value) {
      const selectedJob = jobs.find(j => String(j.id) === String(value));
      if (selectedJob) {
  const customerId = selectedJob.customer_id || selectedJob.customer || selectedJob.customerId || '';
        setFormData(prev => ({
          ...prev,
          job: value,
          customer: customerId || prev.customer, // keep previous if none
          vehicle_model: prev.vehicle_model || selectedJob.vehicle_model || selectedJob.vehicleModel || '',
          vehicle_plate: prev.vehicle_plate || selectedJob.vehicle_plate || selectedJob.vehiclePlate || '',
          service_description: prev.service_description || selectedJob.service_description || selectedJob.serviceDescription || '',
          notes: prev.notes || `Auto-generated from job #${selectedJob.id}`,
          items: (prev.items && prev.items.length > 0 && prev.items[0].description)
            ? prev.items
            : [{
                item_type: 'service',
                description: selectedJob.service_description || selectedJob.serviceDescription || 'Service Charge',
                quantity: '1',
                unit_price: selectedJob.estimated_cost || selectedJob.estimatedCost || '',
                part_number: ''
              }]
        }));
      }
      // Always attempt server prefill (ensures we have definitive customer + parts)
      ;(async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/billing/invoices/prefill/?job_id=${value}`, { headers: getAuthHeaders() });
          if (!resp.ok) return; // silent fail
          const data = await resp.json();
          setFormData(prev => ({
            ...prev,
            job: data.job || prev.job,
            customer: data.customer || prev.customer,
            vehicle_model: data.vehicle_model || prev.vehicle_model,
            vehicle_plate: data.vehicle_plate || prev.vehicle_plate,
            service_description: data.service_description || prev.service_description,
            due_date: data.due_date || prev.due_date,
            subtotal: data.subtotal ? String(data.subtotal) : prev.subtotal,
            // Only replace items if user hasn't manually edited first item description yet
            items: (prev.items.length === 0 || !prev.items[0].description)
              ? (Array.isArray(data.items)
                  ? data.items.map(it => ({
                      item_type: it.item_type || 'service',
                      description: it.description || '',
                      quantity: String(it.quantity || '1'),
                      unit_price: String(it.unit_price || it.total_price || ''),
                      part_number: it.part_number || ''
                    }))
                  : prev.items)
              : prev.items,
            notes: prev.notes || `Auto-filled from job #${value}`
          }));
        } catch (err) {
          console.warn('Prefill fetch failed', err);
        }
      })();
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((it,i)=> i===index ? { ...it, [field]: value } : it)
    }));
  };
  const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { item_type:'service', description:'', quantity:'1', unit_price:'', part_number:'' }] }));
  const removeItem = (index) => { if (formData.items.length > 1) setFormData(prev => ({ ...prev, items: prev.items.filter((_,i)=> i!==index) })); };

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(formData.tax_rate) || 0;
    const discountAmount = parseFloat(formData.discount_amount) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    return subtotal + taxAmount - discountAmount;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Invoice number is required';
    }
    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }
    if (!formData.service_description.trim()) {
      newErrors.service_description = 'Service description is required';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Item description is required';
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        newErrors[`item_${index}_unit_price`] = 'Valid unit price is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const subtotal = calculateSubtotal();
      const invoiceData = {
        ...formData,
        subtotal: subtotal.toString(),
        items: formData.items.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      };

      if (mode === 'create') {
        await createInvoice(invoiceData);
      } else {
        await updateInvoice(invoice.id, invoiceData);
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      customer: '',
      job: '',
      vehicle_model: '',
      vehicle_plate: '',
      service_description: '',
      subtotal: '',
      tax_rate: '15',
      discount_amount: '0',
      due_date: '',
      notes: '',
      items: [
        {
          item_type: 'service',
          description: '',
          quantity: '1',
          unit_price: '',
          part_number: ''
        }
      ]
    });
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-heading-semibold text-text-primary">
            {mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="modern-button p-2 hover:bg-background"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Invoice Number *
                </label>
                <Input
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  className="modern-input"
                  error={errors.invoice_number}
                />
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Due Date *
                </label>
                <Input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="modern-input"
                  error={errors.due_date}
                />
              </div>
            </div>

            {/* Customer and Job */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Customer *
                </label>
                <div className="relative">
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    disabled={isCustomerLocked}
                    className={`modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection ${isCustomerLocked ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                  </select>
                  {isCustomerLocked && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Locked by Job
                    </div>
                  )}
                </div>
                {errors.customer && (
                  <p className="text-error text-sm mt-1">{errors.customer}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Related Job (Optional)
                </label>
                <select
                  name="job"
                  value={formData.job}
                  onChange={handleInputChange}
                  className="modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection"
                >
                  <option value="">Select Job</option>
                  {jobs.length === 0 && (
                    <option disabled value="">No jobs available</option>
                  )}
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {(job.service_description || 'Job')} - {(job.customer_name || job.customer_name || 'Customer')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Vehicle Model
                </label>
                <Input
                  name="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={handleInputChange}
                  className="modern-input"
                  placeholder="e.g., Toyota Camry 2020"
                />
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Vehicle Plate
                </label>
                <Input
                  name="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={handleInputChange}
                  className="modern-input"
                  placeholder="e.g., ABC-123"
                />
              </div>
            </div>

            {/* Service Description */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Service Description *
              </label>
              <textarea
                name="service_description"
                value={formData.service_description}
                onChange={handleInputChange}
                rows={3}
                className="modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection resize-none"
                placeholder="Describe the service provided..."
              />
              {errors.service_description && (
                <p className="text-error text-sm mt-1">{errors.service_description}</p>
              )}
            </div>

            {/* Invoice Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading-medium text-text-primary">Invoice Items</h3>
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  size="sm"
                  className="modern-button border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="modern-card p-4 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-body-medium text-text-primary">Item {index + 1}</h4>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeItem(index)}
                          variant="ghost"
                          size="sm"
                          className="modern-button p-1 hover:bg-error/10 text-error"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-body-medium text-text-primary mb-2">
                          Type
                        </label>
                        <select
                          value={item.item_type}
                          onChange={(e) => handleItemChange(index, 'item_type', e.target.value)}
                          className="modern-input w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection"
                        >
                          <option value="service">Service</option>
                          <option value="part">Part</option>
                          <option value="labor">Labor</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-body-medium text-text-primary mb-2">
                          Description *
                        </label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="modern-input"
                          placeholder="Item description"
                          error={errors[`item_${index}_description`]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-body-medium text-text-primary mb-2">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="modern-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-body-medium text-text-primary mb-2">
                          Unit Price *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className="modern-input"
                          placeholder="0.00"
                          error={errors[`item_${index}_unit_price`]}
                        />
                      </div>
                    </div>

                    {item.item_type === 'part' && (
                      <div className="mt-4">
                        <label className="block text-sm font-body-medium text-text-primary mb-2">
                          Part Number
                        </label>
                        <Input
                          value={item.part_number}
                          onChange={(e) => handleItemChange(index, 'part_number', e.target.value)}
                          className="modern-input"
                          placeholder="Part number"
                        />
                      </div>
                    )}

                    <div className="mt-4 text-right">
                      <span className="text-sm text-text-secondary">
                        Total: ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Tax Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="tax_rate"
                  value={formData.tax_rate}
                  onChange={handleInputChange}
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Discount Amount ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  name="discount_amount"
                  value={formData.discount_amount}
                  onChange={handleInputChange}
                  className="modern-input"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="modern-card p-4 bg-background/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({formData.tax_rate}%):</span>
                      <span>${((calculateSubtotal() * (parseFloat(formData.tax_rate) || 0)) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${(parseFloat(formData.discount_amount) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-heading-medium text-lg border-t border-border pt-2">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection resize-none"
                placeholder="Additional notes..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-border bg-background/25">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="modern-button border-border hover:border-primary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="modern-button bg-primary text-primary-foreground"
          >
            {loading ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                {mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
