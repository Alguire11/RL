import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn } from "@/lib/queryClient";

interface SubscriptionData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate: string | null;
  createdAt: string;
  cancelledAt: string | null;
}

interface SubscriptionStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  churnRate: number;
  avgRevenuePerUser: number;
  freeUsers: number;
  standardUsers: number;
  premiumUsers: number;
}

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      setLocation('/admin-login');
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<SubscriptionStats>({
    queryKey: ["/api/admin/subscription-stats"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<SubscriptionData[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: (data: { subscriptionId: string; updates: any }) => 
      fetch(`/api/admin/subscriptions/${data.subscriptionId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updates),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update subscription');
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Subscription has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    }
  });

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchTerm || 
      sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    const matchesPlan = filterPlan === "all" || sub.plan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      case 'standard':
        return <Badge className="bg-blue-100 text-blue-800">Standard</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30"><Navigation /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setLocation('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
              </div>
              <p className="text-gray-600">Monitor and manage user subscriptions</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? formatCurrency(stats.monthlyRevenue) : '£0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? formatCurrency(stats.totalRevenue) : '£0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.activeSubscriptions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? `${stats.churnRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Distribution */}
        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">{stats.freeUsers}</div>
                  <div className="text-sm text-gray-500">Free Users</div>
                  <div className="text-xs text-gray-400">
                    {stats.totalSubscriptions > 0 ? 
                      `${((stats.freeUsers / (stats.freeUsers + stats.standardUsers + stats.premiumUsers)) * 100).toFixed(1)}%` 
                      : '0%'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.standardUsers}</div>
                  <div className="text-sm text-gray-500">Standard Users</div>
                  <div className="text-xs text-gray-400">
                    {stats.totalSubscriptions > 0 ? 
                      `${((stats.standardUsers / (stats.freeUsers + stats.standardUsers + stats.premiumUsers)) * 100).toFixed(1)}%` 
                      : '0%'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.premiumUsers}</div>
                  <div className="text-sm text-gray-500">Premium Users</div>
                  <div className="text-xs text-gray-400">
                    {stats.totalSubscriptions > 0 ? 
                      `${((stats.premiumUsers / (stats.freeUsers + stats.standardUsers + stats.premiumUsers)) * 100).toFixed(1)}%` 
                      : '0%'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Subscription Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Users</Label>
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="trialing">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plan">Filter by Plan</Label>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions ({filteredSubscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionsLoading ? (
              <div className="text-center py-8">Loading subscriptions...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.userName}</div>
                          <div className="text-sm text-gray-500">{subscription.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(subscription.plan)}</TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(subscription.amount, subscription.currency)}
                      </TableCell>
                      <TableCell className="capitalize">{subscription.billingCycle}</TableCell>
                      <TableCell>{formatDate(subscription.nextBillingDate)}</TableCell>
                      <TableCell>{formatDate(subscription.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateSubscriptionMutation.mutate({
                                subscriptionId: subscription.id,
                                updates: { /* subscription updates */ }
                              });
                            }}
                            disabled={updateSubscriptionMutation.isPending}
                          >
                            Edit
                          </Button>
                          {subscription.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateSubscriptionMutation.mutate({
                                  subscriptionId: subscription.id,
                                  updates: { status: 'cancelled' }
                                });
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}