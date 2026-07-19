import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/layout/AppShell';
import AuthShell from './components/layout/AuthShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import WorkDetailPage from './pages/WorkDetailPage';
import CertificatePage from './pages/CertificatePage';
import AlertsPage from './pages/AlertsPage';
import PricingPage from './pages/PricingPage';
import VerifyPage from './pages/VerifyPage';
import NotFoundPage from './pages/NotFoundPage';
import OtpPage from './pages/OtpPage';
import SplitSheetPage from './pages/SplitSheetPage';
import WalletPage from './pages/WalletPage';
import DistributionPage from './pages/DistributionPage';
import { ROUTES } from './lib/routes';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public shell — navbar visible */}
          <Route element={<AppShell />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.PRICING} element={<PricingPage />} />
            <Route path={ROUTES.VERIFY} element={<VerifyPage />} />
          </Route>

          {/* Auth shell — no navbar, centered logo */}
          <Route element={<AuthShell />}>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.OTP} element={<OtpPage />} />
          </Route>

          {/* Protected routes — redirect to /login if not authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.UPLOAD} element={<UploadPage />} />
              <Route path={ROUTES.WORK} element={<WorkDetailPage />} />
              <Route path={ROUTES.CERTIFICATE} element={<CertificatePage />} />
              <Route path={ROUTES.ALERTS} element={<AlertsPage />} />
              <Route path={ROUTES.SPLIT_SHEET} element={<SplitSheetPage />} />
              <Route path={ROUTES.WALLET} element={<WalletPage />} />
              <Route path={ROUTES.DISTRIBUTE} element={<DistributionPage />} />
            </Route>
          </Route>


          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
