import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth";
import ReplitAuth from "@/pages/replit-auth";
import About from "@/pages/about";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Contact from "@/pages/contact";
import Help from "@/pages/help";
import Status from "@/pages/status";
import Product from "@/pages/product";
import Support from "@/pages/support";
import AdminDashboard from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import LandlordLogin from "@/pages/landlord-login";
import LandlordSignup from "@/pages/landlord-signup";
import ForgotPassword from "@/pages/forgot-password";
import LandlordDashboard from "@/pages/landlord-dashboard";
import LandlordProperties from "@/pages/landlord-properties";
import LandlordTenants from "@/pages/landlord-tenants";
import LandlordMaintenance from "@/pages/landlord-maintenance";
import LandlordVerifications from "@/pages/landlord-verifications";
import LandlordAnalytics from "@/pages/landlord-analytics";
import LandlordVerification from "@/pages/landlord-verification";
import LandlordVerify from "@/pages/landlord-verify";
import LandlordVerifyPayment from "@/pages/landlord-verify-payment";
import OnboardingPage from "@/pages/onboarding";
import RentTracker from "@/pages/rent-tracker";
import RentScoreBuilder from "@/pages/rent-score-builder";
import ManualVerify from "@/pages/manual-verify";
import Trust from "@/pages/trust";
import ReportGenerator from "@/pages/report-generator";
import Portfolio from "@/pages/portfolio";
import PublicPortfolio from "@/pages/public-portfolio";
import Subscribe from "@/pages/subscribe";
import SupportRequest from "@/pages/support-request";
import MaintenancePage from "@/pages/maintenance";
import VerifyEmail from "@/pages/verify-email";
import VerifyEmailEnforced from "@/pages/verify-email-enforced";

// Lazy load admin pages
const AdminUsers = lazy(() => import("@/pages/admin-users"));
const AdminSettings = lazy(() => import("@/pages/admin-settings"));
const AdminSubscriptions = lazy(() => import("@/pages/admin-subscriptions"));
const AdminRevenue = lazy(() => import("@/pages/admin-revenue"));
const AdminModeration = lazy(() => import("@/pages/admin-moderation"));
const AdminProperties = lazy(() => import("@/pages/admin-properties"));
const AdminAuditLogs = lazy(() => import("@/pages/admin-audit-logs"));
const AdminUserDetails = lazy(() => import("@/pages/admin-user-details"));
const AdminManualVerification = lazy(() => import("@/pages/admin-manual-verification"));
const Disputes = lazy(() => import("@/pages/disputes"));

import { useDomainType, getAppUrl, getAdminUrl } from "./lib/domain-router";
import { useEffect } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const domainType = useDomainType();
  const [, setLocation] = useLocation();

  // Redirect logic for cross-domain navigation
  useEffect(() => {
    // If we are on the main domain but trying to access admin/app routes
    // OR if we are on app domain trying to access landing

    // Allow development environment to access everything
    if (window.location.hostname.includes('localhost') || window.location.hostname.includes('replit')) {
      return;
    }

    if (domainType === 'main') {
      // Main domain specific redirects handled in render
    }
  }, [domainType]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            RentLedger
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 1. ADMIN DOMAIN (admin.rentledger.co.uk)
  // ---------------------------------------------------------------------------
  if (domainType === 'admin') {
    return (
      <Switch>
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/" component={() => {
          // Redirect root of admin domain to admin login or dashboard
          if (!isAuthenticated) return <AdminLogin />;
          return <AdminDashboard />;
        }} />

        {/* Admin Routes */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminUsers />
          </Suspense>
        )} />
        <Route path="/admin/users/:id" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminUserDetails />
          </Suspense>
        )} />
        <Route path="/admin/settings" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminSettings />
          </Suspense>
        )} />
        <Route path="/admin/subscriptions" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminSubscriptions />
          </Suspense>
        )} />
        <Route path="/admin/revenue" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminRevenue />
          </Suspense>
        )} />
        <Route path="/admin/moderation" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminModeration />
          </Suspense>
        )} />
        <Route path="/admin/verifications" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminManualVerification />
          </Suspense>
        )} />
        <Route path="/admin/properties" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminProperties />
          </Suspense>
        )} />
        <Route path="/admin/audit-logs" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdminAuditLogs />
          </Suspense>
        )} />
        <Route path="/disputes" component={() => (
          <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <Disputes />
          </Suspense>
        )} />

        {/* Catch all for admin - redirect to dashboard or 404 */}
        <Route component={() => <NotFound />} />
      </Switch>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. MAIN MARKETING DOMAIN (rentledger.co.uk)
  // ---------------------------------------------------------------------------
  if (domainType === 'main') {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/about" component={About} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/contact" component={Contact} />
        <Route path="/help" component={Help} />
        <Route path="/status" component={Status} />
        <Route path="/product" component={Product} />

        {/* Redirect Login/App attempts to APP DOMAIN */}
        <Route path="/login" component={() => {
          window.location.href = getAppUrl('/auth');
          return null;
        }} />
        <Route path="/signup" component={() => {
          window.location.href = getAppUrl('/auth?tab=signup');
          return null;
        }} />
        <Route path="/auth" component={() => {
          window.location.href = getAppUrl('/auth');
          return null;
        }} />
        <Route path="/admin" component={() => {
          window.location.href = getAdminUrl('/admin-login'); // Redirect to admin subdomain
          return null;
        }} />
        <Route path="/admin-login" component={() => {
          window.location.href = getAdminUrl('/admin-login');
          return null;
        }} />

        {/* Allow public portfolio as it might be shared widely */}
        <Route path="/portfolio/:shareToken" component={PublicPortfolio} />

        <Route component={NotFound} />
      </Switch>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. TENANT APP DOMAIN (myrentledger.co.uk) & Fallback/Localhost
  // ---------------------------------------------------------------------------
  return (
    <Switch>
      {/* Public endpoints needed on app domain too */}
      <Route path="/verify-email/:token" component={VerifyEmail} />
      <Route path="/verify-email-enforced" component={VerifyEmailEnforced} />

      <Route path="/landlord/verify/:token" component={LandlordVerify} />
      <Route path="/landlord/verify-payment/:token" component={LandlordVerifyPayment} />

      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Root route - always show Landing Page as requested, even on app domain */}
      <Route path="/" component={Landing} />

      {/* Public Pages shared with Main Domain (for Footer Links) */}
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
      <Route path="/product" component={Product} />
      <Route path="/status" component={Status} />

      {/* Landlord Routes */}
      <Route path="/landlord-login" component={LandlordLogin} />
      <Route path="/landlord-signup" component={LandlordSignup} />
      <Route path="/landlord-dashboard" component={LandlordDashboard} />
      <Route path="/landlord-properties" component={LandlordProperties} />
      <Route path="/landlord-tenants" component={LandlordTenants} />
      <Route path="/landlord-maintenance" component={LandlordMaintenance} />
      <Route path="/landlord-verifications" component={LandlordVerifications} />
      <Route path="/landlord-analytics" component={LandlordAnalytics} />
      <Route path="/landlord-verification" component={LandlordVerification} />

      {/* Tenant App Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/rent-tracker" component={RentTracker} />
      <Route path="/rent-score-builder" component={RentScoreBuilder} />
      <Route path="/manual-verify" component={ManualVerify} />
      <Route path="/trust" component={Trust} />
      <Route path="/report-generator" component={ReportGenerator} />
      <Route path="/portfolio" component={Portfolio} />

      <Route path="/subscribe" component={Subscribe} />
      <Route path="/support-request" component={SupportRequest} />
      <Route path="/maintenance" component={MaintenancePage} />

      {/* Support pages also available in app */}
      <Route path="/support" component={Support} />
      <Route path="/help" component={Help} />

      {/* If admin tries to access admin routes on app domain, redirect? 
           Or just 404 to hide them. Let's 404 for security through obscurity. */}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
