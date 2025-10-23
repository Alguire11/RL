import { Switch, Route } from "wouter";
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
import LandlordDashboard from "@/pages/landlord-dashboard";
import LandlordVerification from "@/pages/landlord-verification";
import LandlordVerify from "@/pages/landlord-verify";
import OnboardingPage from "@/pages/onboarding";
import RentTracker from "@/pages/rent-tracker";
import ReportGenerator from "@/pages/report-generator";
import Portfolio from "@/pages/portfolio";
import Subscribe from "@/pages/subscribe";

// Lazy load admin pages
const AdminUsers = lazy(() => import("@/pages/admin-users"));
const AdminSettings = lazy(() => import("@/pages/admin-settings"));
const AdminSubscriptions = lazy(() => import("@/pages/admin-subscriptions"));
const AdminRevenue = lazy(() => import("@/pages/admin-revenue"));
const AdminModeration = lazy(() => import("@/pages/admin-moderation"));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Enoíkio
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public landlord verification route */}
      <Route path="/landlord/verify/:token" component={LandlordVerify} />
      
      {/* Public routes - available when not authenticated */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/support" component={Support} />
      <Route path="/contact" component={Contact} />  
      <Route path="/help" component={Help} />
      <Route path="/status" component={Status} />
      <Route path="/product" component={Product} />
      <Route path="/landlord-verification" component={LandlordVerification} />
      
      {/* Admin and special routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={() => (
        <Suspense fallback={<div className="min-h-screen bg-light-gray flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
          <AdminUsers />
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
      <Route path="/landlord-dashboard" component={LandlordDashboard} />
      <Route path="/subscribe" component={Subscribe} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route path="/about" component={About} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/support" component={Support} />
          <Route path="/contact" component={Contact} />
          <Route path="/help" component={Help} />
          <Route path="/status" component={Status} />
          <Route path="/product" component={Product} />
          <Route path="/landlord-verification" component={LandlordVerification} />
          <Route path="/onboarding" component={OnboardingPage} />
          <Route path="/rent-tracker" component={RentTracker} />
          <Route path="/report-generator" component={ReportGenerator} />
          <Route path="/portfolio" component={Portfolio} />
        </>
      )}
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
