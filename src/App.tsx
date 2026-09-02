import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CommandPalette } from './components/CommandPalette';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminSignupPage } from './pages/AdminSignupPage';
import { NotFound } from './pages/NotFound';

// Layout shells
import { DriverLayout } from './layouts/DriverLayout';
import { OwnerLayout } from './layouts/OwnerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Driver experience pages
import { DriverDashboard } from './pages/DriverDashboard';
import { FindParking } from './pages/FindParking';
import { ParkingDetails } from './pages/ParkingDetails';
import { DriverBookings } from './pages/DriverBookings';
import { BookingConfirmation } from './pages/BookingConfirmation';
import { DriverHistory } from './pages/DriverHistory';
import { DriverFavorites } from './pages/DriverFavorites';
import { DriverProfile } from './pages/DriverProfile';
import { DriverSettings } from './pages/DriverSettings';

// Owner experience pages
import { OwnerDashboard } from './pages/OwnerDashboard';
import { OwnerParking } from './pages/OwnerParking';
import { OwnerSlots } from './pages/OwnerSlots';
import { OwnerRevenue } from './pages/OwnerRevenue';
import { OwnerAnalytics } from './pages/OwnerAnalytics';
import { OwnerSettings } from './pages/OwnerSettings';
import { OwnerOperations } from './pages/OwnerOperations';
import { OwnerAccessLogs } from './pages/OwnerAccessLogs';
import { OwnerInvoices } from './pages/OwnerInvoices';

// Admin experience pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminParking } from './pages/AdminParking';
import { AdminBookings } from './pages/AdminBookings';
import { AdminComplaints } from './pages/AdminComplaints';
import { AdminAudits } from './pages/AdminAudits';
import { AdminSettings } from './pages/AdminSettings';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <CommandPalette />
          
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin-signup" element={<AdminSignupPage />} />

            {/* DRIVER SPACE (allowed role: DRIVER) */}
            <Route 
              path="/app" 
              element={
                <ProtectedRoute allowedRoles={['DRIVER']}>
                  <DriverLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DriverDashboard />} />
              <Route path="find" element={<FindParking />} />
              <Route path="parking/:id" element={<ParkingDetails />} />
              <Route path="bookings" element={<DriverBookings />} />
              <Route path="bookings/:id" element={<BookingConfirmation />} />
              <Route path="history" element={<DriverHistory />} />
              <Route path="favorites" element={<DriverFavorites />} />
              <Route path="profile" element={<DriverProfile />} />
              <Route path="settings" element={<DriverSettings />} />
            </Route>

            {/* OWNER SPACE (allowed role: OWNER) */}
            <Route 
              path="/owner" 
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OwnerDashboard />} />
              <Route path="parking" element={<OwnerParking />} />
              <Route path="operations" element={<OwnerOperations />} />
              <Route path="access-logs" element={<OwnerAccessLogs />} />
              <Route path="invoices" element={<OwnerInvoices />} />
              <Route path="slots" element={<OwnerSlots />} />
              <Route path="revenue" element={<OwnerRevenue />} />
              <Route path="analytics" element={<OwnerAnalytics />} />
              <Route path="settings" element={<OwnerSettings />} />
            </Route>

            {/* ADMIN SPACE (allowed role: ADMIN) */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="parking" element={<AdminParking />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="audit" element={<AdminAudits />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Fallbacks */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
