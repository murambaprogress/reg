import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useInventory } from '../InventoryContext';

const EditPartModal = ({ isOpen, onClose, part, onSave }) => {
  const { createPart, updatePart, categories: ctxCategories = [], suppliers: ctxSuppliers = [] } = useInventory();
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    category: '', // store selected category name (hardcoded list)
    supplier: '',
    unitCost: '',
    currentStock: '',
    minimumThreshold: '',
    unit: '',
    location: '',
    notes: ''
  });

  // Hardcoded stock category names for the add/edit UI. These are presented
  // to users as the selectable categories. On submit we map the selected
  // name to a backend category id if one exists with the same name.
  const stockCategories = [
    'Engine Parts',
    'Brake System',
    'Suspension',
    'Electrical',
    'Body Parts',
    'Filters',
    'Fluids',
    'Tools'
  ];

  // backend categories (used only to map name -> id when submitting)
  const categories = Array.isArray(ctxCategories) ? ctxCategories : [];

  // Use registered suppliers from the database
  const suppliers = Array.isArray(ctxSuppliers) ? ctxSuppliers : [];

  const units = ['pcs', 'liters', 'kg', 'meters', 'sets'];

  useEffect(() => {
    if (part) {
  setFormData({
  partNumber: part.part_number ?? part.partNumber ?? '',
  description: part.description || '',
  // prefer category name where available for the hardcoded select
  category: (part.category && part.category.name) ? part.category.name : (part.category_name ?? part.category_id ?? part.category ?? ''),
        supplier: part.supplier || '',
        unitCost: part.unit_cost ?? part.unitCost ?? '',
        currentStock: part.current_stock ?? part.currentStock ?? '',
        minimumThreshold: part.minimum_threshold ?? part.minimumThreshold ?? '',
        unit: part.unit || '',
        location: part.location || '',
        notes: part.notes || ''
      });
    }
  }, [part]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // map the selected category name to a backend category id if available
    const matchedCat = categories.find(c => String(c.name).toLowerCase() === String(formData.category).toLowerCase());
    const payload = {
      part_number: formData.partNumber,
      description: formData.description,
      // backend expects category_id for write operations; use matched id when found
      category_id: matchedCat ? matchedCat.id : null,
      supplier: formData.supplier,
      unit_cost: isNaN(parseFloat(formData.unitCost)) ? 0 : parseFloat(formData.unitCost),
      current_stock: isNaN(parseInt(formData.currentStock)) ? 0 : parseInt(formData.currentStock),
      minimum_threshold: isNaN(parseInt(formData.minimumThreshold)) ? 0 : parseInt(formData.minimumThreshold),
      unit: formData.unit,
      location: formData.location,
      notes: formData.notes
    };

    if (part && part.id) {
      updatePart(part.id, payload).then((res) => {
        window.__SHOW_TOAST && window.__SHOW_TOAST('Part updated', 'success');
        if (typeof onSave === 'function') onSave(res);
        if (typeof onClose === 'function') onClose();
      }).catch((err) => {
        window.__SHOW_TOAST && window.__SHOW_TOAST('Failed to update part', 'error');
      });
    } else {
      createPart(payload).then((res) => {
        window.__SHOW_TOAST && window.__SHOW_TOAST('Part created', 'success');
        if (typeof onSave === 'function') onSave(res);
        if (typeof onClose === 'function') onClose();
      }).catch(() => {
        window.__SHOW_TOAST && window.__SHOW_TOAST('Failed to create part', 'error');
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal">
      <div className="bg-surface rounded-lg border border-border w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border sticky top-0 bg-surface">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading-medium text-text-primary">{part ? 'Edit Part' : 'Create Part'}</h3>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part Number */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Part Number <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                value={formData.partNumber}
                onChange={(e) => handleChange('partNumber', e.target.value)}
                required
                placeholder="Enter part number"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Description <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                placeholder="Enter description"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Category <span className="text-error">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="w-full p-3 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select category</option>
                {stockCategories.map((catName) => (
                  <option key={catName} value={catName}>{catName}</option>
                ))}
              </select>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Supplier <span className="text-error">*</span>
              </label>
              <select
                value={formData.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                required
                className="w-full p-3 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id || supplier.name} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Unit Cost <span className="text-error">*</span>
              </label>
              <Input
                type="number"
                value={formData.unitCost}
                onChange={(e) => handleChange('unitCost', e.target.value)}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            {/* Current Stock */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Current Stock <span className="text-error">*</span>
              </label>
              <Input
                type="number"
                value={formData.currentStock}
                onChange={(e) => handleChange('currentStock', e.target.value)}
                required
                min="0"
                placeholder="Enter current stock"
              />
            </div>

            {/* Minimum Threshold */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Minimum Threshold <span className="text-error">*</span>
              </label>
              <Input
                type="number"
                value={formData.minimumThreshold}
                onChange={(e) => handleChange('minimumThreshold', e.target.value)}
                required
                min="0"
                placeholder="Enter minimum threshold"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Unit <span className="text-error">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                required
                className="w-full p-3 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select unit</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Storage Location
              </label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Shelf A-1, Bin 23"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows="3"
                placeholder="Additional notes about this part..."
                className="w-full p-3 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPartModal;
