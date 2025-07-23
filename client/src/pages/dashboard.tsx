import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CheckCircle, Calendar, TrendingUp, Plus, FileText, Share2, PoundSterling } from "lucide-react";
import { format } from "date-fns";
import { AddressEditor } from "@/components/address-editor";
import { RentDateEditor } from "@/components/rent-date-editor";
import { PropertyForm } from "@/components/property-form";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
    retry: false,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-light-gray">
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
    <div className="min-h-screen bg-light-gray">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your rental payments and build your credit portfolio</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Payment Streak"
            value={`${stats?.paymentStreak || 0} months`}
            icon={CheckCircle}
            color="success"
          />
          <StatCard
            title="Total Paid"
            value={formatCurrency(stats?.totalPaid || 0)}
            icon={PoundSterling}
            color="primary"
          />
          <StatCard
            title="On-Time Rate"
            value={`${Math.round(stats?.onTimePercentage || 0)}%`}
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <AddressEditor />
          <RentDateEditor />
          <PropertyForm />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment History */}
          <Card>
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
                  {payments?.slice(0, 3).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                          <p className="font-medium">{formatDate(payment.dueDate)}</p>
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
                  {(!payments || payments.length === 0) && (
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
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <GradientButton className="w-full h-12 justify-center">
                  <Plus className="w-5 h-5 mr-3" />
                  Add Payment Record
                </GradientButton>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  Generate Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 border-secondary text-secondary hover:bg-secondary hover:text-white"
                >
                  <Share2 className="w-5 h-5 mr-3" />
                  Share Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Section */}
        {properties && properties.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Your Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {properties.map((property: any) => (
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
      </div>
    </div>
  );
}
