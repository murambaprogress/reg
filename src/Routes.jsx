import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ThemeProvider from "components/ui/ThemeProvider";
import { ToastProvider } from "components/ui/Toast";
import { TechnicianSyncProvider } from "./pages/technician-workstation/TechnicianSyncContext";
import Footer from 'components/ui/Footer';
import { UserProvider } from "./components/UserContext";
import { SalesProvider } from "./pages/sales-shop/SalesContext";
import { InventoryProvider } from "./pages/inventory-management/InventoryContext";
import { TechnicianProvider } from "./pages/technician-workstation/TechnicianContext";
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
import DebtorsManagementPage from "pages/debtors-management/DebtorsManagementPage";
import { BillingProvider } from "pages/billing-expenses/BillingContext";
import NotFound from "pages/NotFound";
import SupplierManagement from "pages/supplier-management";
import SalesShop from "pages/sales-shop";
import AdminDashboard from "pages/admin-dashboard";

// Route guard for login/public pages. Redirects if user is already logged in.
const GuestRoute = ({ element }) => {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.token) {
    // If user is authenticated, redirect them away from the login page
    const redirectPath = user.role === 'technician' ? "/technician-workstation" : "/admin-dashboard";
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
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User is logged in but does not have the required role
    return <NotFound />;
  }

  return element;
};

// A component to handle the root path and redirect appropriately
const RootRedirect = () => {
  const { user, loading } = useUser();
  const location = useLocation();

  // TEMPORARY: Always go to login for now
  console.log('RootRedirect - user:', user, 'loading:', loading);
  return <Navigate to="/login" replace />;

  /* ORIGINAL CODE - DISABLED FOR DEBUGGING
  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.token) {
    // If user is logged in, redirect based on role or previous location
    const from = location.state?.from?.pathname || (user.role === 'technician' ? "/technician-workstation" : "/admin-dashboard");
    return <Navigate to={from} replace />;
  }

  // If not logged in, go to the login page
  return <Navigate to="/login" replace />;
  */
};


const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <UserProvider>
            <TechnicianSyncProvider>
              <ThemeProvider>
                <InventoryProvider>
                  <SalesProvider>
                    <ScrollToTop />
                    <RouterRoutes>
                      {/* Root path redirects based on auth status */}
                      <Route path="/" element={<RootRedirect />} />

                      {/* Login page is only for guests */}
                      <Route path="/login" element={<GuestRoute element={<Login />} />} />

                      {/* Protected Routes */}
                      <Route path="/dashboard-overview" element={<ProtectedRoute element={<BillingProvider><DashboardOverview /></BillingProvider>} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/inventory-management" element={<ProtectedRoute element={<InventoryManagement />} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/reports-analytics" element={<ProtectedRoute element={<ReportsAnalytics />} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/technician-workstation" element={<ProtectedRoute element={<TechnicianProvider><TechnicianWorkstation /></TechnicianProvider>} allowedRoles={["technician"]} />} />
                      <Route path="/job-management" element={<ProtectedRoute element={<JobManagement />} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/customer-management" element={<ProtectedRoute element={<CustomerManagement />} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/billing-expenses" element={<ProtectedRoute element={<BillingExpenses />} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/debtors-management" element={<ProtectedRoute element={<DebtorsManagementPage />} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/supplier-management" element={<ProtectedRoute element={<SupplierManagement />} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/sales-shop" element={<ProtectedRoute element={<SalesShop />} allowedRoles={["admin","supervisor"]} />} />
                      <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={["admin","supervisor"]} />} />
                      
                      {/* Not Found Route */}
                      <Route path="*" element={<NotFound />} />
                    </RouterRoutes>
                    <Footer />
                  </SalesProvider>
                </InventoryProvider>
              </ThemeProvider>
            </TechnicianSyncProvider>
          </UserProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
