import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const JobForm = ({ job, onSave, onCancel, customers, technicians, isEditing = false }) => {
  const [formData, setFormData] = useState({
    customer_id: job?.customer?.id || job?.customerId || '',
    customer_name: job?.customer_name || job?.customerName || '',
    vehicle_model: job?.vehicle_model || job?.vehicleModel || '',
    vehicle_plate: job?.vehicle_plate || job?.vehiclePlate || '',
    vehicle_year: job?.vehicle_year || job?.vehicleYear || '',
    service_description: job?.service_description || job?.serviceDescription || '',
    estimated_hours: job?.estimated_hours || job?.estimatedHours || '',
    estimated_cost: job?.estimated_cost || job?.estimatedCost || '',
    technician_id: job?.technician?.id || job?.technicianId || '',
    priority: job?.priority || 'Medium',
    due_date: job?.due_date || job?.dueDate || '',
    notes: job?.notes || '',
    vehicle_photos: job?.vehicle_photos || job?.vehiclePhotos || []
  });

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill customer details when customer is selected
    if (name === 'customer_id') {
      const selectedCustomer = customers.find(c => c.id === parseInt(value));
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customer_name: selectedCustomer.name
        }));
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    const newPhotos = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setFormData(prev => ({
      ...prev,
      vehicle_photos: [...prev.vehicle_photos, ...newPhotos]
    }));
  };

  const removePhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      vehicle_photos: prev.vehicle_photos.filter(photo => photo.id !== photoId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading-semibold text-text-primary">
          {isEditing ? 'Edit Job Card' : 'Create New Job Card'}
        </h2>
        <Button variant="ghost" onClick={onCancel}>
          <Icon name="X" size={20} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading-medium text-text-primary">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Customer *
              </label>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <Input
                    type="text"
                    name="customer_name"
                    placeholder="Enter customer name"
                    value={formData.customer_name}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        customer_name: e.target.value,
                        // Clear selected customer ID when typing
                        customer_id: formData.customer_id && !customers.find(c => c.name.toLowerCase() === e.target.value.toLowerCase()) ? '' : prev.customer_id
                      }));
                    }}
                    required
                  />
                  {customers.length > 0 && !formData.customer_id && formData.customer_name && (
                    <div className="mt-1 text-xs text-text-secondary">
                      <button
                        type="button"
                        className="text-accent hover:underline"
                        onClick={() => {
                          const existingCustomer = customers.find(c => 
                            c.name.toLowerCase() === formData.customer_name.toLowerCase()
                          );
                          if (existingCustomer) {
                            setFormData(prev => ({
                              ...prev,
                              customer_id: existingCustomer.id,
                              customer_name: existingCustomer.name
                            }));
                          }
                        }}
                      >
                        Check for existing customer
                      </button>
                    </div>
                  )}
                </div>
                {customers.length > 0 && (
                  <select
                    value={formData.customer_id}
                    onChange={(e) => {
                      const customerId = e.target.value;
                      const selectedCustomer = customers.find(c => String(c.id) === customerId);
                      setFormData(prev => ({
                        ...prev,
                        customer_id: customerId,
                        customer_name: selectedCustomer ? selectedCustomer.name : prev.customer_name
                      }));
                    }}
                    className="w-1/2 px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                  >
                    <option value="">Select existing customer (optional)</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading-medium text-text-primary">Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              name="vehicle_model"
              placeholder="Vehicle Model"
              value={formData.vehicle_model}
              onChange={handleInputChange}
              required
            />
            <Input
              type="text"
              name="vehicle_plate"
              placeholder="License Plate"
              value={formData.vehicle_plate}
              onChange={handleInputChange}
              required
            />
            <Input
              type="number"
              name="vehicle_year"
              placeholder="Year"
              value={formData.vehicle_year}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading-medium text-text-primary">Service Details</h3>
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Service Description *
            </label>
            <textarea
              name="service_description"
              value={formData.service_description}
              onChange={handleInputChange}
              placeholder="Describe the service required..."
              rows={4}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              name="estimated_hours"
              placeholder="Estimated Hours"
              value={formData.estimated_hours}
              onChange={handleInputChange}
              required
            />
            <Input
              type="number"
              name="estimated_cost"
              placeholder="Estimated Cost ($)"
              value={formData.estimated_cost}
              onChange={handleInputChange}
              required
            />
            <Input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Technician Assignment */}
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-2">
            Assign Technician *
          </label>
          <select
            name="technician_id"
            value={formData.technician_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">Select Technician</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.username || tech.name} - {tech.email}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Photos */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading-medium text-text-primary">Vehicle Photos</h3>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center micro-interaction ${
              dragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Icon name="Upload" size={32} className="mx-auto text-text-secondary mb-2" />
            <p className="text-text-secondary mb-2">
              Drag and drop photos here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-accent hover:underline"
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-text-secondary">PNG, JPG up to 10MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </div>

          {formData.vehicle_photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.vehicle_photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute -top-2 -right-2 bg-error text-error-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 micro-interaction"
                  >
                    <Icon name="X" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Any additional notes or special instructions..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Update Job Card' : 'Create Job Card'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
