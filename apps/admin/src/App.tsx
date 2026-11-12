import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { KycVerificationPage } from './features/kyc/KycVerificationPage';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { MembersPage } from './features/members/MembersPage';
import { ServicesModerationPage } from './features/services/ServicesModerationPage';
import { RequestsDeskPage } from './features/requests/RequestsDeskPage';
import { MeetingsPage } from './features/meetings/MeetingsPage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { PaymentReceiptPage } from './features/payments/PaymentReceiptPage';
import { SupportTicketsPage } from './features/support/SupportTicketsPage';
import { StaffManagementPage } from './features/staff/StaffManagementPage';
import { AuditLogsPage } from './features/audit-logs/AuditLogsPage';
import { ReferralBonusPage } from './features/referrals/ReferralBonusPage';
import { FundingDeskPage } from './features/funding/FundingDeskPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading FIC operations console...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="kyc" element={<KycVerificationPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payments/:id/receipt" element={<PaymentReceiptPage />} />
        <Route path="meetings" element={<MeetingsPage />} />
        <Route path="services" element={<ServicesModerationPage />} />
        <Route path="referrals" element={<ReferralBonusPage />} />
        <Route path="funding" element={<FundingDeskPage />} />
        <Route path="requests" element={<RequestsDeskPage />} />
        <Route path="support" element={<SupportTicketsPage />} />
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

