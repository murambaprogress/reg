import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CategorySidebar = ({ categories, selectedCategory, onCategorySelect, filters, onFilterChange }) => {
  const [expandedCategories, setExpandedCategories] = useState(['all']);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      supplier: '',
      stockStatus: 'all',
      priceRange: { min: '', max: '' }
    });
    onCategorySelect('all');
  };

  return (
    <div className="bg-surface border-r border-border h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-heading-medium text-text-primary">Categories</h3>
        <Button 
          variant="text" 
          onClick={clearFilters}
          className="mt-2 text-xs"
        >
          Clear All Filters
        </Button>
      </div>

      {/* Categories */}
      <div className="p-4 space-y-2">
        {categories.map((category) => (
          <div key={category.id}>
            <button
              onClick={() => {
                onCategorySelect(category.id);
                if (category.subcategories?.length > 0) {
                  toggleCategory(category.id);
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left micro-interaction ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-background text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name={category.icon} size={16} />
                <span className="text-sm font-body-medium">{category.name}</span>
                <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </div>
              {category.subcategories?.length > 0 && (
                <Icon 
                  name={expandedCategories.includes(category.id) ? "ChevronDown" : "ChevronRight"} 
                  size={14} 
                />
              )}
            </button>

            {/* Subcategories */}
            {category.subcategories?.length > 0 && expandedCategories.includes(category.id) && (
              <div className="ml-6 mt-2 space-y-1">
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onCategorySelect(sub.id)}
                    className={`w-full flex items-center justify-between p-2 rounded text-left micro-interaction ${
                      selectedCategory === sub.id
                        ? 'bg-accent/10 text-accent' :'hover:bg-background text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="text-sm">{sub.name}</span>
                    <span className="text-xs text-text-secondary">{sub.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Filters */}
      <div className="p-4 border-t border-border">
        <h4 className="text-sm font-heading-medium text-text-primary mb-3">Quick Filters</h4>
        
        {/* Stock Status Filter */}
        <div className="mb-4">
          <label className="block text-xs font-body-medium text-text-secondary mb-2">Stock Status</label>
          <select
            value={filters.stockStatus}
            onChange={(e) => onFilterChange({ ...filters, stockStatus: e.target.value })}
            className="w-full p-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Items</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="mb-4">
          <label className="block text-xs font-body-medium text-text-secondary mb-2">Price Range</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange.min}
              onChange={(e) => onFilterChange({ 
                ...filters, 
                priceRange: { ...filters.priceRange, min: e.target.value }
              })}
              className="w-full p-2 border border-border rounded text-xs bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange.max}
              onChange={(e) => onFilterChange({ 
                ...filters, 
                priceRange: { ...filters.priceRange, max: e.target.value }
              })}
              className="w-full p-2 border border-border rounded text-xs bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Supplier Filter */}
        <div>
          <label className="block text-xs font-body-medium text-text-secondary mb-2">Supplier</label>
          <select
            value={filters.supplier}
            onChange={(e) => onFilterChange({ ...filters, supplier: e.target.value })}
            className="w-full p-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Suppliers</option>
            <option value="AutoParts Plus">AutoParts Plus</option>
            <option value="Premium Motors">Premium Motors</option>
            <option value="Global Auto Supply">Global Auto Supply</option>
            <option value="QuickFix Parts">QuickFix Parts</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;