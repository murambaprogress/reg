import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const Breadcrumb = () => {
  const location = useLocation();
  
  const routeMap = {
    '/dashboard-overview': { label: 'Dashboard Overview', parent: null },
    '/job-management': { label: 'Job Management', parent: null },
    '/technician-workstation': { label: 'Technician Workstation', parent: null },
    '/inventory-management': { label: 'Inventory Management', parent: null },
    '/customer-management': { label: 'Customer Management', parent: null },
    '/reports-analytics': { label: 'Reports & Analytics', parent: null },
  };

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs = [];
    
    // Always start with Dashboard as home
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/dashboard-overview',
      isActive: false
    });

    // Add current page if it's not dashboard
    if (location.pathname !== '/dashboard-overview') {
      const currentRoute = routeMap[location.pathname];
      if (currentRoute) {
        breadcrumbs.push({
          label: currentRoute.label,
          path: location.pathname,
          isActive: true
        });
      }
    } else {
      // Mark dashboard as active if we're on it
      breadcrumbs[0].isActive = true;
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1 && breadcrumbs[0]?.isActive) {
    return null; // Don't show breadcrumbs on dashboard
  }

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      <Icon name="Home" size={16} className="text-text-secondary" />
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && (
            <Icon name="ChevronRight" size={14} className="text-text-secondary" />
          )}
          {crumb.isActive ? (
            <span className="text-text-primary font-body-medium" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="text-text-secondary hover:text-text-primary micro-interaction font-body-normal"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;