import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  PoundSterling, 
  Bell,
  Plus,
  Filter,
  ArrowLeft
} from "lucide-react";
import { format, addDays, isAfter, isBefore } from "date-fns";
import type { RentPayment, ApiProperty, PaymentStatus } from "@/types/api";
import type { DashboardStats } from "@shared/dashboard";

export default function RentTracker() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddPayment, setShowAddPayment] = useState(false);
  interface PaymentFormState {
    amount: string;
    dueDate: string;
    propertyId: string;
    description: string;
  }

  interface CreatePaymentPayload {
    amount: string;
    dueDate: string;
    propertyId: number | null;
    description: string;
    status: PaymentStatus;
  }

  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    amount: '',
    dueDate: '',
    propertyId: '',
    description: ''
  });
  const { hasFeature, plan, isFreePlan } = useSubscription();

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<RentPayment[]>({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: properties = [] } = useQuery<ApiProperty[]>({
    queryKey: ["/api/properties"],
    retry: false,
  });

  const { data: stats } = useQuery<DashboardStats | undefined>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const markPaidMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}`, {
        status: "paid",
        paidDate: new Date().toISOString().split('T')[0]
      });
      if (!response.ok) throw new Error("Failed to mark payment as paid");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Payment Marked as Paid",
        description: "Your rent payment has been recorded successfully.",
      });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (paymentData: CreatePaymentPayload) => {
      const response = await apiRequest("POST", "/api/payments", paymentData);
      if (!response.ok) throw new Error("Failed to add payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Payment Added",
        description: "New payment record has been created.",
      });
      setShowAddPayment(false);
      setPaymentForm({ amount: '', dueDate: '', propertyId: '', description: '' });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  type TrackerStatus = 'paid' | 'overdue' | 'due-soon' | 'upcoming';

  const getPaymentStatus = (payment: RentPayment): TrackerStatus => {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);

    if (payment.status === 'paid') return 'paid';
    if (isAfter(today, dueDate)) return 'overdue';
    if (isAfter(today, addDays(dueDate, -3))) return 'due-soon';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'due-soon': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'overdue': return 'Overdue';
      case 'due-soon': return 'Due Soon';
      default: return 'Upcoming';
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === 'all') return true;
    return getPaymentStatus(payment) === filterStatus;
  });

  const nextPayment = payments.find((payment) =>
    payment.status !== 'paid' && isAfter(new Date(payment.dueDate), new Date())
  );

  const paymentStreak = stats?.paymentStreak || 0;
  const onTimePercentage = stats?.onTimePercentage || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rent Tracker</h1>
          <p className="text-gray-600">Monitor your rent payments and build your credit history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Streak</p>
                  <p className="text-3xl font-bold text-green-600">{paymentStreak}</p>
                  <p className="text-xs text-gray-500">months on time</p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{Math.round(onTimePercentage)}%</p>
                  <Progress value={onTimePercentage} className="w-20 mt-2" />
                </div>
                <CheckCircle className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Next Payment</p>
                  {nextPayment ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(Number(nextPayment.amount))}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due {format(new Date(nextPayment.dueDate), 'MMM dd')}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-gray-500">No upcoming payments</p>
                  )}
                </div>
                <Calendar className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All Payments' },
              { key: 'paid', label: 'Paid' },
              { key: 'due-soon', label: 'Due Soon' },
              { key: 'overdue', label: 'Overdue' },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={filterStatus === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          
          <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Payment</DialogTitle>
                <DialogDescription>
                  Add a rent payment record to track your payment history.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (£)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="1200"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={paymentForm.dueDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="property">Property</Label>
                  <Select value={paymentForm.propertyId} onValueChange={(value) => setPaymentForm({ ...paymentForm, propertyId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.address}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">Add new property</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Monthly rent payment"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddPayment(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const propertyId = paymentForm.propertyId === 'new' ? null : parseInt(paymentForm.propertyId);
                      addPaymentMutation.mutate({
                        amount: paymentForm.amount,
                        dueDate: paymentForm.dueDate,
                        propertyId,
                        description: paymentForm.description || 'Rent payment',
                        status: 'pending' as PaymentStatus,
                      });
                    }}
                    disabled={!paymentForm.amount || !paymentForm.dueDate || addPaymentMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addPaymentMutation.isPending ? 'Adding...' : 'Add Payment'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Track your rent payment history and build your credit profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                    <p className="text-gray-600 mb-4">
                      {filterStatus === 'all' 
                        ? "Start by adding your first rent payment to begin tracking your history."
                        : `No payments match the "${getStatusText(filterStatus)}" filter.`
                      }
                    </p>
                    <Button onClick={() => setFilterStatus('all')}>
                      {filterStatus === 'all' ? 'Add Payment' : 'View All Payments'}
                    </Button>
                  </div>
                ) : (
                  filteredPayments.map((payment) => {
                    const status = getPaymentStatus(payment);
                    const property = properties.find((p) => p.id === payment.propertyId);
                    
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            status === 'paid' ? 'bg-green-100' : 
                            status === 'overdue' ? 'bg-red-100' : 
                            status === 'due-soon' ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            {status === 'paid' ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : status === 'overdue' ? (
                              <Clock className="h-6 w-6 text-red-600" />
                            ) : (
                              <PoundSterling className="h-6 w-6 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {property?.address || 'Rent Payment'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                              {payment.paidDate && status === 'paid' && (
                                <> • Paid: {format(new Date(payment.paidDate), 'MMM dd, yyyy')}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(Number(payment.amount))}
                            </p>
                            <Badge className={getStatusColor(status)}>
                              {getStatusText(status)}
                            </Badge>
                          </div>
                          {status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markPaidMutation.mutate(payment.id)}
                              disabled={markPaidMutation.isPending}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Reminders */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Payment Reminders
            </CardTitle>
            <CardDescription>
              Get notified before your rent is due
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasFeature('customReminders') ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-blue-900">Custom Reminder Notifications</h3>
                  <p className="text-sm text-blue-700">Configure advanced reminder settings</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            ) : (
              <SubscriptionGuard feature="customReminders" requiredPlan="standard" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}