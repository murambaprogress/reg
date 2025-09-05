import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ThemeProvider from "components/ui/ThemeProvider";
import Footer from 'components/ui/Footer';
import { UserProvider } from "./components/UserContext";
import { SalesProvider } from "./pages/sales-shop/SalesContext";
import { InventoryProvider } from "./pages/inventory-management/InventoryContext";
import { useUser } from "./components/UserContext";
// Add your imports here
import DashboardOverview from "pages/dashboard-overview";
import InventoryManagement from "pages/inventory-management";
import ReportsAnalytics from "pages/reports-analytics";
import Login from 'pages/Login';
import TechnicianWorkstation from "pages/technician-workstation";
import JobManagement from "pages/job-management";
import CustomerManagement from "pages/customer-management";
import BillingExpenses from "pages/billing-expenses";
import NotFound from "pages/NotFound";
import SupplierManagement from "pages/supplier-management";
import SalesShop from "pages/sales-shop";
import AdminDashboard from "pages/admin-dashboard";

// Route guard for login/public pages
const PublicRoute = ({ element }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is authenticated, redirect based on role
  if (user?.token) {
    let redirectPath;
    if (user.role === 'technician') {
      redirectPath = "/technician-workstation";
    } else {
      redirectPath = location.state?.from || "/admin-dashboard";
    }
    return <Navigate to={redirectPath} replace />;
  }

  return element;
};

// Protected route guard for authenticated pages
const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user?.token) {
    // Save the attempted URL and redirect to login
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return element;
};

const AuthRedirect = ({ element }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.token) {
    // If user is logged in, redirect based on role
    let redirectPath;
    if (user.role === 'technician') {
      redirectPath = "/technician-workstation";
    } else {
      redirectPath = location.state?.from || "/admin-dashboard";
    }
    return <Navigate to={redirectPath} replace />;
  }

  return element;
};


const Routes = () => {
  return (
    <BrowserRouter>
      <UserProvider>
        <InventoryProvider>
          <SalesProvider>
            <ThemeProvider>
              <ErrorBoundary>
                <ScrollToTop />
                <RouterRoutes>
            {/* Root path shows login for unauthenticated users */}
            <Route path="/" element={<AuthRedirect element={<Login />} />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/dashboard-overview" element={<ProtectedRoute element={<DashboardOverview />} allowedRoles={["admin","supervisor","technician"]} />} />
            <Route path="/inventory-management" element={<ProtectedRoute element={<InventoryManagement />} allowedRoles={["admin","supervisor"]} />} />
            <Route path="/reports-analytics" element={<ProtectedRoute element={<ReportsAnalytics />} allowedRoles={["admin","supervisor"]} />} />
            <Route path="/technician-workstation" element={<ProtectedRoute element={<TechnicianWorkstation />} allowedRoles={["admin","supervisor","technician"]} />} />
            <Route path="/job-management" element={<ProtectedRoute element={<JobManagement />} allowedRoles={["admin","supervisor","technician"]} />} />
            <Route path="/customer-management" element={<ProtectedRoute element={<CustomerManagement />} allowedRoles={["admin","supervisor"]} />} />
            <Route path="/billing-expenses" element={<ProtectedRoute element={<BillingExpenses />} allowedRoles={["admin","supervisor"]} />} />
            <Route path="/supplier-management" element={<ProtectedRoute element={<SupplierManagement />} allowedRoles={["admin","supervisor"]} />} />
            <Route path="/sales-shop" element={<ProtectedRoute element={<SalesShop />} allowedRoles={["admin","supervisor"]} />} />
            <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={["admin","supervisor"]} />} />
            <Route path="*" element={<NotFound />} />
                </RouterRoutes>
                <Footer />
              </ErrorBoundary>
            </ThemeProvider>
          </SalesProvider>
        </InventoryProvider>
      </UserProvider>
    </BrowserRouter>
  );
};

export default Routes;
