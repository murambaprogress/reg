import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { useTheme } from './ThemeProvider';
import { useTechnicianSync } from '../../pages/technician-workstation/TechnicianSyncContext';
import { useUser } from '../UserContext';

const Header = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { messages: technicianMessages } = useTechnicianSync();
  // Placeholder: Replace with real API call for low stock alerts
  const [lowStockAlerts] = useState([
    { id: 'stock-1', title: 'Low Stock Alert', message: 'Brake pads running low', type: 'warning', time: '5 min ago', read: false },
    { id: 'stock-2', title: 'Low Stock Alert', message: 'Oil filters below threshold', type: 'warning', time: '10 min ago', read: false }
  ]);
  // Debtor due date notifications (demo, in real app fetch from backend)
  const today = new Date().toISOString().slice(0, 10);
  const debtorDueNotifications = [
    { name: 'Jane Smith', dueDate: '2025-08-20', amount: 200 },
    { name: 'John Doe', dueDate: '2025-08-10', amount: 500 },
  ].filter(d => d.dueDate === today).map((d, i) => ({
    id: 100 + i,
    title: 'Debtor Payment Due',
    message: `${d.name} payment of $${d.amount} is due today!`,
    type: 'warning',
    time: 'Today',
    read: false,
  }));

  // Supplier due date notifications (demo, in real app fetch from backend)
  const supplierDueNotifications = [
    { name: 'ABC Parts', dueDate: '2025-08-20', amount: 1200 },
    { name: 'XYZ Supplies', dueDate: '2025-08-10', amount: 600 },
  ].filter(s => s.dueDate === today).map((s, i) => ({
    id: 200 + i,
    title: 'Supplier Payment Due',
    message: `${s.name} payment of $${s.amount} is due today!`,
    type: 'warning',
    time: 'Today',
    read: false,
  }));

  // Merge notifications: low stock, technician messages, and existing ones
  const notifications = [
    ...lowStockAlerts,
    ...technicianMessages.map((msg, i) => ({
      id: `tech-msg-${msg.id || i}`,
      title: 'Technician Message',
      message: msg.message || msg.text || 'Message from technician',
      type: 'info',
      time: msg.time || msg.created_at || 'Just now',
      read: !!msg.read
    })),
    ...debtorDueNotifications,
    ...supplierDueNotifications,
  ];
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();

  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  let navigationItems = [];
  if (user?.role === 'admin') {
    navigationItems = [
      { label: 'Dashboard', path: '/dashboard-overview', icon: 'LayoutDashboard' },
      { label: 'Jobs', path: '/job-management', icon: 'Wrench' },
      { label: 'Admin', path: '/admin-dashboard', icon: 'Settings' },
      { label: 'Inventory', path: '/inventory-management', icon: 'Package' },
      { label: 'Customers', path: '/customer-management', icon: 'UserCheck' },
      { label: 'Suppliers', path: '/supplier-management', icon: 'Truck' },
      { label: 'Billing', path: '/billing-expenses', icon: 'Receipt' },
      { label: 'Reports', path: '/reports-analytics', icon: 'BarChart3' },
    ];
  } else if (user?.role === 'supervisor') {
    navigationItems = [
      { label: 'Dashboard', path: '/dashboard-overview', icon: 'LayoutDashboard' },
      { label: 'Jobs', path: '/job-management', icon: 'Wrench' },
      { label: 'Admin', path: '/admin-dashboard', icon: 'Settings' },
      { label: 'Inventory', path: '/inventory-management', icon: 'Package' },
      { label: 'Customers', path: '/customer-management', icon: 'UserCheck' },
      { label: 'Suppliers', path: '/supplier-management', icon: 'Truck' },
      { label: 'Billing', path: '/billing-expenses', icon: 'Receipt' },
      { label: 'Reports', path: '/reports-analytics', icon: 'BarChart3' },
    ];
  } else if (user?.role === 'technician') {
    navigationItems = [
      { label: 'Technician Workstation', path: '/technician-workstation', icon: 'Users' },
    ];
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleUserMenuClick = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    // Use the proper logout function from UserContext
    logout();
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return 'AlertTriangle';
      case 'success': return 'CheckCircle';
      case 'error': return 'XCircle';
      default: return 'Info';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'warning': return 'text-warning';
      case 'success': return 'text-success';
      case 'error': return 'text-error';
      default: return 'text-accent';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-[var(--color-surface)] text-[var(--color-text-primary)] dark:bg-[var(--color-background)] dark:text-[var(--color-text-primary)] border-b border-[var(--color-border)] z-nav shadow-elegant">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link 
              to={user?.role === 'technician' ? '/technician-workstation' : '/dashboard-overview'} 
              className="flex items-center space-x-3 modern-button p-2 -m-2 rounded-lg"
            >
              <h1 className="text-lg font-heading-semibold gradient-text">Regimark Autoelectrics</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-body-medium nav-transition modern-button ${
                  isActiveRoute(item.path)
                    ? 'bg-primary text-primary-foreground shadow-lg glow-selection'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background/50'
                }`}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
                  {/* Quick Sales Button - visible to admin & supervisor */}
                  {(user?.role === 'admin' || user?.role === 'supervisor') && (
                    <Link to="/sales-shop" className="modern-button bg-accent text-accent-foreground px-3 py-2 rounded-lg hidden sm:inline-flex items-center space-x-2">
                      <Icon name="ShoppingCart" size={16} />
                      <span className="text-sm">Sales</span>
                    </Link>
                  )}
        
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="modern-button p-2 hover:bg-background/50"
            >
              <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={20} />
            </Button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                onClick={handleUserMenuClick}
                className="modern-button flex items-center space-x-2 p-2 hover:bg-background/50"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
                  <Icon name="User" size={16} color="white" />
                </div>
                <span className="hidden sm:block text-sm font-body-medium text-text-primary">{user?.name || 'User'}</span>
                <Icon name="ChevronDown" size={16} className="text-text-secondary" />
              </Button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 modern-card z-dropdown animate-in slide-in-from-top-2">
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      fullWidth
                      className="modern-button justify-start"
                      onClick={() => { setIsProfileModalOpen(true); setIsUserMenuOpen(false); }}
                    >
                      <Icon name="User" size={16} className="mr-2" />
                      Profile Settings
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth
                      className="modern-button justify-start"
                      onClick={() => { toggleTheme(); setIsUserMenuOpen(false); }}
                    >
                      <Icon name="Palette" size={16} className="mr-2" />
                      Appearance
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth
                      className="modern-button justify-start"
                      onClick={() => { setIsPreferencesModalOpen(true); setIsUserMenuOpen(false); }}
                    >
                      <Icon name="Settings" size={16} className="mr-2" />
                      Preferences
                    </Button>
                    <hr className="my-2 border-border" />
                    <Button
                      variant="ghost"
                      fullWidth
                      className="modern-button justify-start text-error hover:text-error"
                      onClick={handleLogout}
                    >
                      <Icon name="LogOut" size={16} className="mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Modal */}
            {isProfileModalOpen && (
              <div className="fixed inset-0 z-modal flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setIsProfileModalOpen(false)} />
                <div className="modern-card z-10 p-6 w-96">
                  <h3 className="text-lg font-heading-medium">Profile Settings</h3>
                  <p className="text-sm text-text-secondary mt-2">Edit your profile details here. (Demo only)</p>
                  <div className="mt-4 flex justify-end">
                    <Button variant="primary" onClick={() => setIsProfileModalOpen(false)}>Close</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Modal */}
            {isPreferencesModalOpen && (
              <div className="fixed inset-0 z-modal flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setIsPreferencesModalOpen(false)} />
                <div className="modern-card z-10 p-6 w-96">
                  <h3 className="text-lg font-heading-medium">Preferences</h3>
                  <p className="text-sm text-text-secondary mt-2">App preferences and settings (demo).</p>
                  <div className="mt-4 flex justify-end">
                    <Button variant="primary" onClick={() => setIsPreferencesModalOpen(false)}>Close</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              onClick={handleMobileMenuToggle}
              className="lg:hidden modern-button p-2 hover:bg-background/50"
            >
              <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-surface/95 backdrop-blur-sm">
            <nav className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-body-medium nav-transition modern-button ${
                    isActiveRoute(item.path)
                      ? 'bg-primary text-primary-foreground shadow-lg glow-selection'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background/50'
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile Logout Button */}
              {user && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-body-medium nav-transition modern-button text-error hover:text-error hover:bg-error/10"
                >
                  <Icon name="LogOut" size={18} />
                  <span>Logout</span>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
