import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CheckCircle, Calendar, TrendingUp, Plus, FileText, Share2, PoundSterling, Play, HelpCircle, Shield, Award, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { ManualPaymentList } from "@/components/manual-payment-form";
import { PaymentStreakCard } from "@/components/payment-streak-card";
import { AchievementBadgesEarned } from "@/components/achievement-badges-earned";
import { UpcomingBadges } from "@/components/upcoming-badges";
import { EnhancedDataExport } from "@/components/enhanced-data-export";
import { DashboardTour, useDashboardTour } from "@/components/dashboard-tour";
import { format } from "date-fns";
import { AddressEditor } from "@/components/address-editor";
import { RentDateEditor } from "@/components/rent-date-editor";
import { PropertyForm } from "@/components/property-form";
import { Footer } from "@/components/footer";
import { SubscriptionGuard } from "@/components/subscription-guard";
import type { DashboardStats } from "@shared/dashboard";
import type { ApiProperty, RentPayment } from "@/types/api";
import { getQueryFn } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { showTour, startTour, closeTour, completeTour, shouldShowTour } = useDashboardTour();
  const { plan, isLoading: subLoading, subscription } = useSubscription();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        // Use SPA navigation so we don't lose client state.
        setLocation("/auth");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, setLocation, toast]);

  // Auto-start tour for first-time users
  useEffect(() => {
    if (isAuthenticated && !isLoading && shouldShowTour()) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000); // Wait 1 second after page load
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, shouldShowTour, startTour]);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn<DashboardStats>({ on401: "throw" }),
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  useEffect(() => {
    if (!statsError) {
      return;
    }
    const message = statsError instanceof Error ? statsError.message : "Unable to load stats";
    toast({
      title: "Dashboard unavailable",
      description: message,
      variant: "destructive",
    });
  }, [statsError, toast]);

  const { data: properties = [], isLoading: propertiesLoading } = useQuery<ApiProperty[]>({
    queryKey: ["/api/properties"],
    queryFn: getQueryFn<ApiProperty[]>({ on401: "throw" }),
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<RentPayment[]>({
    queryKey: ["/api/payments"],
    queryFn: getQueryFn<RentPayment[]>({ on401: "throw" }),
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  // Helper functions (must be defined before hooks)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate payment status
  const calculatePaymentStatus = (payment: RentPayment) => {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);
    const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;
    
    if (payment.verified) return 'verified';
    if (paidDate) return 'awaiting-verification';
    if (today > dueDate) return 'overdue';
    if (today.toDateString() === dueDate.toDateString()) return 'due-today';
    return 'upcoming';
  };

  // Calculate payment streak
  const calculatePaymentStreak = (payments: RentPayment[]) => {
    // Sort by due date descending (most recent first)
    const sorted = [...payments].sort((a, b) => 
      new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
    let streak = 0;
    
    for (const payment of sorted) {
      if (!payment.paidDate) break;
      const paidDate = new Date(payment.paidDate);
      const dueDate = new Date(payment.dueDate);
      const diffDays = Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // On-time if paid within 5 days of due date
      if (diffDays <= 5) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
    return streak;
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'verified': '#10b981',
      'awaiting-verification': '#f59e0b',
      'overdue': '#ef4444',
      'due-today': '#f97316',
      'upcoming': '#9ca3af'
    };
    return colors[status] || '#9ca3af';
  };

  // All hooks must be called before any conditional returns
  const actionItems = useMemo(() => {
    const tasks: Array<{ id: string; title: string; description: string }> = [];

    if (!propertiesLoading && (!properties || properties.length === 0)) {
      tasks.push({
        id: "add-property",
        title: "Add your first property",
        description: "Create a property profile so payments can be linked for verification.",
      });
    }

    if (stats && stats.pendingVerificationCount > 0) {
      tasks.push({
        id: "verify-payments",
        title: "Verify pending payments",
        description: "Ask your landlord to confirm pending records to boost your credit score.",
      });
    }

    if (stats && stats.verificationStatus === "unverified") {
      tasks.push({
        id: "connect-bank",
        title: "Connect a bank account",
        description: "Link your bank to automatically track rent and build verified history.",
      });
    }

    if (plan.id !== "premium") {
      tasks.push({
        id: "upgrade-plan",
        title: "Upgrade for premium insights",
        description: "Unlock automated exports, smart alerts, and advanced analytics with Premium.",
      });
    }

    return tasks;
  }, [plan.id, properties, propertiesLoading, stats]);

  const handleInternalNavigation = (path: string) => {
    // Centralised navigation helper keeps future button additions consistent.
    setLocation(path);
  };

  // Handle action item clicks
  const handleActionClick = (actionId: string) => {
    switch(actionId) {
      case 'add-property':
        // Scroll to PropertyForm
        const propertyForm = document.querySelector('.property-form');
        if (propertyForm) {
          propertyForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      case 'verify-payments':
        setLocation('/rent-tracker');
        break;
      case 'connect-bank':
        setLocation('/bank-connections');
        break;
      case 'upgrade-plan':
        setLocation('/subscribe');
        break;
    }
  };

  // Early return AFTER all hooks have been called
  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Track your rental payments and build your credit portfolio</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={startTour}
              className="hidden sm:flex items-center bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="mr-2 h-4 w-4" />
              Take Tour
            </Button>
            <Button
              onClick={() => handleInternalNavigation('/report-generator')}
              className="hidden sm:flex items-center bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button
              onClick={() => handleInternalNavigation('/settings')}
              className="notifications hidden sm:flex items-center bg-blue-600 hover:bg-blue-700 text-white"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Subscription Status Banner */}
        {!subLoading && (
          <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Current Plan</p>
                    <p className="text-xl font-bold">{plan.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm opacity-90">Monthly Price</p>
                    <p className="text-lg font-semibold">{plan.price === 0 ? 'Free' : `£${plan.price}/mo`}</p>
                  </div>
                  {plan.id !== 'premium' && (
                    <Button
                      variant="secondary"
                      onClick={() => handleInternalNavigation('/subscribe')}
                      className="bg-white text-blue-600 hover:bg-gray-100"
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="dashboard-stats grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Payment Streak"
            value={stats?.awaitingVerificationCount ? `${stats.paymentStreak ?? 0} ${(stats.paymentStreak ?? 0) === 1 ? 'month' : 'months'} (${stats.awaitingVerificationCount} awaiting verification)` : `${stats?.paymentStreak ?? 0} ${(stats?.paymentStreak ?? 0) === 1 ? 'month' : 'months'}`}
            icon={CheckCircle}
            color="success"
          />
          <StatCard
            title="Total Paid"
            value={stats?.totalAwaiting ? `${formatCurrency(stats.totalPaid ?? 0)} (${formatCurrency(stats.totalAwaiting)} awaiting verification)` : formatCurrency(stats?.totalPaid ?? 0)}
            icon={PoundSterling}
            color="primary"
          />
          <StatCard
            title="On-Time Rate"
            value={`${Math.round(stats?.onTimePercentage ?? 0)}%`}
            icon={TrendingUp}
            color="secondary"
          />
          <StatCard
            title="Next Payment"
            value={stats?.nextPaymentDue ? `${getDaysUntilDue(stats.nextPaymentDue)} days` : 'No upcoming payments'}
            icon={Calendar}
            color="accent"
          />
        </div>

        {/* Monthly Summary & Credit Score */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Monthly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{(stats?.monthlyRentPaid ?? 0) > 0 && payments.filter(p => {
                    const paidDate = p.paidDate ? new Date(p.paidDate) : null;
                    if (!paidDate) return false;
                    const now = new Date();
                    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
                  }).length > 1 ? 'Rent Payments This Month' : 'Rent Paid This Month'}</span>
                  <span className="font-semibold text-lg">{formatCurrency(stats?.monthlyRentPaid ?? 0)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verification Status</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={stats?.verificationStatus === 'verified' ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                      {stats?.verified ?? 0} Verified
                    </Badge>
                    {stats?.awaitingVerificationCount ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {stats.awaitingVerificationCount} Awaiting
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Credit Growth</span>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">{stats?.creditGrowth ? `${stats.creditGrowth >= 0 ? '+' : ''}${stats.creditGrowth} points` : '+0 points'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Score Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                Credit Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stats?.creditScore ?? 0}
                  </div>
                  <p className="text-sm text-gray-600">out of 1000</p>
                </div>
                <Progress value={(stats?.creditScore ?? 0) / 10} className="h-3" />
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-gray-500">On-Time</p>
                    <p className="font-semibold">{stats?.onTimeScore ?? 0} pts</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Verified</p>
                    <p className="font-semibold">{stats?.verificationScore ?? 0} pts</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ratio</p>
                    <p className="font-semibold">{stats?.rentToIncomeScore ?? 0} pts</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Score based on: On-time payments (60%), Verification (20%), Rent-to-income (20%)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="bank-connections grid md:grid-cols-3 gap-6 mb-8">
          <AddressEditor 
            currentAddress={properties[0] ? {
              street: properties[0].address,
              city: properties[0].city,
              postcode: properties[0].postcode || undefined,
              country: 'United Kingdom'
            } : undefined}
            propertyId={properties[0]?.id}
          />
          <RentDateEditor 
            currentRentInfo={properties[0] ? {
              amount: parseFloat(String(properties[0].monthlyRent)),
              dayOfMonth: 1, // Default, can be enhanced later
              frequency: 'monthly',
              firstPaymentDate: properties[0].tenancyStartDate || undefined
            } : undefined}
            propertyId={properties[0]?.id}
          />
          <PropertyForm />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment History */}
          <Card className="payment-history">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">Recent Payments</CardTitle>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setLocation('/rent-tracker')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.slice(0, 3).map((payment) => {
                    const paymentStatus = calculatePaymentStatus(payment);
                    const statusColor = getStatusColor(paymentStatus);
                    const isVerified = Boolean(payment.verified ?? payment.isVerified);
                    
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 transition-colors"
                        style={{ borderLeftColor: statusColor }}
                      >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${statusColor}20` }}
                        >
                          {paymentStatus === 'verified' || paymentStatus === 'awaiting-verification' ? (
                            <CheckCircle className="w-5 h-5" style={{ color: statusColor }} />
                          ) : paymentStatus === 'overdue' ? (
                            <Calendar className="w-5 h-5" style={{ color: statusColor }} />
                          ) : (
                            <Calendar className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{formatDate(payment.dueDate)}</p>
                            {paymentStatus === 'verified' && (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {paymentStatus === 'awaiting-verification' && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                Awaiting Verification
                              </Badge>
                            )}
                            {paymentStatus === 'overdue' && (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                                Overdue
                              </Badge>
                            )}
                            {paymentStatus === 'due-today' && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                Due Today
                              </Badge>
                            )}
                            {paymentStatus === 'upcoming' && (
                              <Badge variant="secondary" className="text-xs">
                                Upcoming
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {paymentStatus === 'verified' ? 'Verified payment' : 
                             paymentStatus === 'awaiting-verification' ? 'Waiting for landlord confirmation' :
                             paymentStatus === 'overdue' ? 'Payment overdue' :
                             paymentStatus === 'due-today' ? 'Payment due today' :
                             'Upcoming payment'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(payment.amount))}</p>
                        <p className="text-sm text-gray-600">
                          {payment.paidDate ? formatDate(payment.paidDate) : 'Due ' + formatDate(payment.dueDate)}
                        </p>
                      </div>
                      </div>
                    );
                  })}
                  {payments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No payment history yet</p>
                      <p className="text-sm">Add your first payment to get started</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="credit-reports">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <GradientButton
                  className="w-full h-12 justify-center"
                  onClick={() => handleInternalNavigation('/rent-tracker')}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Add Payment Record
                </GradientButton>
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-[#1e3a8a] bg-gray-100 text-[#1e3a8a] hover:bg-[#1e3a8a] hover:!text-white transition-colors"
                  onClick={() => handleInternalNavigation('/report-generator')}
                >
                  <FileText className="w-5 h-5 mr-3" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-[#1e3a8a] bg-gray-100 text-[#1e3a8a] hover:bg-[#1e3a8a] hover:!text-white transition-colors"
                  onClick={() => handleInternalNavigation('/portfolio')}
                >
                  <Share2 className="w-5 h-5 mr-3" />
                  Share Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Section */}
        {properties.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Your Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {properties.map((property) => (
                  <div key={property.id} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">{property.address}</h3>
                    <p className="text-sm text-gray-600 mb-1">{property.city}, {property.postcode}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(Number(property.monthlyRent))}/month</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Badge */}
        <div className="security-badge mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Your data is secured with bank-level encryption
            </span>
          </div>
        </div>

        {/* Actionable next steps keep the tenant focused on completion. */}
        {actionItems.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Next best actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleActionClick(item.id)}
                    className="w-full p-4 bg-white rounded-lg border border-dashed border-primary/40 hover:bg-blue-50 hover:border-primary cursor-pointer transition-colors text-left"
                  >
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Features Section - Reorganized per image layout */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: Manual Payment Logging */}
          <div className="lg:col-span-1">
            <ManualPaymentList />
          </div>
          
          {/* Middle Column: Payment Streak, Achievement Badges, Upcoming Badges, Enhanced Data Export */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Streak Progress */}
            <PaymentStreakCard />
            
            {/* Achievement Badges (Earned) */}
            <AchievementBadgesEarned />
            
            {/* Upcoming Badges */}
            <UpcomingBadges />
            
            {/* Enhanced Data Export - Premium Feature */}
            <SubscriptionGuard feature="enhancedExports" requiredPlan="premium">
              <EnhancedDataExport />
            </SubscriptionGuard>
          </div>
          
          {/* Right Column: Empty or can add other content */}
          <div className="lg:col-span-1">
            {/* Reserved for future content */}
          </div>
        </div>

        {/* Tour Component */}
        <DashboardTour 
          isOpen={showTour} 
          onClose={closeTour} 
          onComplete={completeTour} 
        />
      </div>
      <Footer />
    </div>
  );
}
