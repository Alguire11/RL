import { useEffect } from "react";
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
import { ManualPaymentForm, ManualPaymentList } from "@/components/manual-payment-form";
import { AchievementBadges } from "@/components/achievement-badges";
import { EnhancedDataExport } from "@/components/enhanced-data-export";
import { DashboardTour, useDashboardTour } from "@/components/dashboard-tour";
import { format } from "date-fns";
import { AddressEditor } from "@/components/address-editor";
import { RentDateEditor } from "@/components/rent-date-editor";
import { PropertyForm } from "@/components/property-form";

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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Auto-start tour for first-time users
  useEffect(() => {
    if (isAuthenticated && !isLoading && shouldShowTour()) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000); // Wait 1 second after page load
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, shouldShowTour, startTour]);

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ["/api/properties"],
    retry: false,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
    retry: false,
  });

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
              variant="outline"
              onClick={startTour}
              className="hidden sm:flex items-center"
            >
              <Play className="mr-2 h-4 w-4" />
              Take Tour
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/report-generator'}
              className="hidden sm:flex items-center"
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/settings'}
              className="notifications hidden sm:flex items-center"
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
                      onClick={() => setLocation('/settings')}
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
            value={`${(stats as any)?.paymentStreak || 0} months`}
            icon={CheckCircle}
            color="success"
          />
          <StatCard
            title="Total Paid"
            value={formatCurrency((stats as any)?.totalPaid || 0)}
            icon={PoundSterling}
            color="primary"
          />
          <StatCard
            title="On-Time Rate"
            value={`${Math.round((stats as any)?.onTimePercentage || 0)}%`}
            icon={TrendingUp}
            color="secondary"
          />
          <StatCard
            title="Next Payment"
            value={(stats as any)?.nextPaymentDue ? `${getDaysUntilDue((stats as any).nextPaymentDue)} days` : 'No upcoming payments'}
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
                  <span className="text-gray-600">Rent Paid This Month</span>
                  <span className="font-semibold text-lg">{formatCurrency((stats as any)?.monthlyRentPaid || 0)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verification Status</span>
                  <Badge variant={(stats as any)?.verificationStatus === 'verified' ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                    {(stats as any)?.verified || 0} Verified
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Credit Growth</span>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">+{(stats as any)?.creditGrowth || 0} points</span>
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
                    {(stats as any)?.creditScore || 0}
                  </div>
                  <p className="text-sm text-gray-600">out of 1000</p>
                </div>
                <Progress value={((stats as any)?.creditScore || 0) / 10} className="h-3" />
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-gray-500">On-Time</p>
                    <p className="font-semibold">{Math.round(((stats as any)?.creditScore || 0) * 0.6)} pts</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Verified</p>
                    <p className="font-semibold">{Math.round(((stats as any)?.creditScore || 0) * 0.2)} pts</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ratio</p>
                    <p className="font-semibold">{Math.round(((stats as any)?.creditScore || 0) * 0.2)} pts</p>
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
          <AddressEditor />
          <RentDateEditor />
          <PropertyForm />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment History */}
          <Card className="payment-history">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">Recent Payments</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
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
                  {(payments as any[])?.slice(0, 3).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4" style={{borderLeftColor: payment.verified ? '#10b981' : '#9ca3af'}}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          payment.status === 'paid' ? 'bg-success/10' : 'bg-gray-300'
                        }`}>
                          {payment.status === 'paid' ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <Calendar className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{formatDate(payment.dueDate)}</p>
                            {payment.verified && (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {!payment.verified && payment.status === 'paid' && (
                              <Badge variant="secondary" className="text-xs">Pending</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {payment.status === 'paid' ? 'Paid on time' : 'Pending payment'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(parseFloat(payment.amount))}</p>
                        <p className="text-sm text-gray-600">
                          {payment.paidDate ? formatDate(payment.paidDate) : 'Due ' + formatDate(payment.dueDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!payments || (payments as any[]).length === 0) && (
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
                  onClick={() => setLocation('/rent-tracker')}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Add Payment Record
                </GradientButton>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={() => setLocation('/report-generator')}
                >
                  <FileText className="w-5 h-5 mr-3" />
                  Generate Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 border-secondary text-secondary hover:bg-secondary hover:text-white"
                  onClick={() => setLocation('/portfolio')}
                >
                  <Share2 className="w-5 h-5 mr-3" />
                  Share Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Section */}
        {properties && (properties as any[]).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Your Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {(properties as any[]).map((property: any) => (
                  <div key={property.id} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">{property.address}</h3>
                    <p className="text-sm text-gray-600 mb-1">{property.city}, {property.postcode}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(parseFloat(property.monthlyRent))}/month</p>
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

        {/* Additional Features Section */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Manual Payment Logging */}
          <div className="lg:col-span-1">
            <ManualPaymentList />
          </div>
          
          {/* Achievement Badges */}
          <div className="lg:col-span-1">
            <AchievementBadges />
          </div>
          
          {/* Enhanced Data Export */}
          <div className="lg:col-span-1">
            <EnhancedDataExport />
          </div>
        </div>

        {/* Tour Component */}
        <DashboardTour 
          isOpen={showTour} 
          onClose={closeTour} 
          onComplete={completeTour} 
        />
      </div>
    </div>
  );
}
