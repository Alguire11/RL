import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, ArrowLeft, DollarSign, Users, Calendar, BarChart3, PieChart, LineChart } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn } from "@/lib/queryClient";

interface RevenueData {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  growthRate: number;
  refunds: number;
}

interface RevenueChart {
  date: string;
  revenue: number;
  subscriptions: number;
  churn: number;
}

interface TopMetrics {
  newSubscriptions: number;
  upgrades: number;
  downgrades: number;
  cancellations: number;
  netRevenue: number;
  grossRevenue: number;
}

export default function AdminRevenue() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      setLocation('/admin-login');
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData>({
    queryKey: [`/api/admin/revenue-data?range=${timeRange}`],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: chartData = [], isLoading: chartLoading } = useQuery<RevenueChart[]>({
    queryKey: [`/api/admin/revenue-chart?range=${timeRange}`],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: topMetrics, isLoading: metricsLoading } = useQuery<TopMetrics>({
    queryKey: [`/api/admin/revenue-metrics?range=${timeRange}`],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? '↗' : '↘';
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
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
              </div>
              <p className="text-gray-600">Monitor financial performance and growth metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Revenue Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {revenueData ? formatCurrency(revenueData.monthlyRecurringRevenue) : '£0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className={`flex items-center mt-2 text-sm ${getGrowthColor(revenueData?.growthRate || 0)}`}>
                <span>{getGrowthIcon(revenueData?.growthRate || 0)}</span>
                <span className="ml-1">{formatPercentage(revenueData?.growthRate || 0)} from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Annual Recurring Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {revenueData ? formatCurrency(revenueData.annualRecurringRevenue) : '£0'}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Projected annual revenue
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Revenue Per User</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {revenueData ? formatCurrency(revenueData.averageRevenuePerUser) : '£0'}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Per active subscriber
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer Lifetime Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {revenueData ? formatCurrency(revenueData.customerLifetimeValue) : '£0'}
                  </p>
                </div>
                <LineChart className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Expected customer value
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Revenue Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topMetrics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="font-medium">Gross Revenue</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(topMetrics.grossRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="font-medium">Refunds</span>
                    <span className="text-lg font-bold text-red-600">
                      -{formatCurrency(revenueData?.refunds || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-400">
                    <span className="font-medium">Net Revenue</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(topMetrics.netRevenue)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">Loading revenue data...</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Subscription Changes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topMetrics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">New</Badge>
                      <span>New Subscriptions</span>
                    </div>
                    <span className="font-bold text-green-600">+{topMetrics.newSubscriptions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-100 text-blue-800">Upgrade</Badge>
                      <span>Plan Upgrades</span>
                    </div>
                    <span className="font-bold text-blue-600">+{topMetrics.upgrades}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-800">Downgrade</Badge>
                      <span>Plan Downgrades</span>
                    </div>
                    <span className="font-bold text-yellow-600">-{topMetrics.downgrades}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-t">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
                      <span>Cancellations</span>
                    </div>
                    <span className="font-bold text-red-600">-{topMetrics.cancellations}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">Loading metrics...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="h-5 w-5" />
              <span>Revenue Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="text-center py-16">Loading revenue chart...</div>
            ) : chartData.length > 0 ? (
              <div className="h-64 flex items-end space-x-2">
                {chartData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-200 hover:bg-blue-300 transition-colors rounded-t"
                      style={{ 
                        height: `${Math.max((data.revenue / Math.max(...chartData.map(d => d.revenue))) * 200, 4)}px` 
                      }}
                      title={`${formatCurrency(data.revenue)} on ${format(new Date(data.date), 'dd MMM')}`}
                    />
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45">
                      {format(new Date(data.date), 'dd/MM')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">No revenue data available for this period</div>
            )}
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Churn Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {revenueData ? `${revenueData.churnRate.toFixed(1)}%` : '0%'}
              </div>
              <p className="text-sm text-gray-600">
                Percentage of customers who cancelled their subscriptions
              </p>
              <div className={`mt-2 text-sm ${getGrowthColor(-(revenueData?.churnRate || 0))}`}>
                {revenueData?.churnRate ? (
                  revenueData.churnRate < 5 ? 'Excellent retention' : 
                  revenueData.churnRate < 10 ? 'Good retention' : 'Needs improvement'
                ) : 'No data'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Growth Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-2 ${getGrowthColor(revenueData?.growthRate || 0)}`}>
                {revenueData ? formatPercentage(revenueData.growthRate) : '0%'}
              </div>
              <p className="text-sm text-gray-600">
                Revenue growth compared to previous period
              </p>
              <div className="mt-2 text-sm text-gray-500">
                {revenueData?.growthRate ? (
                  revenueData.growthRate > 20 ? 'Exceptional growth' : 
                  revenueData.growthRate > 10 ? 'Strong growth' : 
                  revenueData.growthRate > 0 ? 'Positive growth' : 'Declining'
                ) : 'No data'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Total Revenue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {revenueData ? formatCurrency(revenueData.totalRevenue) : '£0'}
              </div>
              <p className="text-sm text-gray-600">
                All-time revenue generated from subscriptions
              </p>
              <div className="mt-2 text-sm text-gray-500">
                Since platform launch
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}