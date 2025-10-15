import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

/**
 * DropdownMenu component for displaying action menus with an ellipsis (three dots) button
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of menu items with { label, icon, onClick, color, disabled }
 * @param {string} props.position - Position of the dropdown menu: "left", "right" (default)
 * @param {string} props.buttonVariant - Button style: "ghost" (default), "outline", "primary"
 * @param {string} props.size - Size of the trigger button: "sm", "md" (default), "lg"
 * @param {string} props.className - Additional CSS classes for the menu button
 */
const DropdownMenu = ({ 
  items = [], 
  position = 'right', 
  buttonVariant = 'ghost',
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get button size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'p-1';
      case 'lg': return 'p-3';
      default: return 'p-2';
    }
  };

  // Get button variant classes
  const getVariantClasses = () => {
    switch (buttonVariant) {
      case 'outline': return 'border border-border bg-surface hover:bg-background/80';
      case 'primary': return 'bg-primary text-primary-foreground hover:bg-primary/90';
      default: return 'hover:bg-background/80';
    }
  };

  // Get menu position classes
  const getPositionClasses = () => {
    return position === 'left' 
      ? 'left-0' 
      : 'right-0';
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (onClick) => {
    setIsOpen(false);
    if (typeof onClick === 'function') {
      onClick();
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className={`rounded-md ${getSizeClasses()} ${getVariantClasses()} ${className}`}
        aria-label="Open menu"
      >
        <Icon name="MoreVertical" size={16} />
      </button>

      {isOpen && (
        <div 
          ref={menuRef} 
          className={`absolute z-dropdown mt-1 ${getPositionClasses()} w-48 rounded-md bg-surface shadow-lg border border-border`}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                disabled={item.disabled}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-background/80 micro-transition 
                  ${item.color || 'text-text-primary'}
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !item.disabled && handleItemClick(item.onClick)}
              >
                {item.icon && <Icon name={item.icon} size={16} />}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;