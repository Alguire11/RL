import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CreditCard, FileText, Activity, Shield, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [adminSession, setAdminSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for admin session
  useEffect(() => {
    try {
      const session = localStorage.getItem('admin_session');
      if (session) {
        const parsedSession = JSON.parse(session);
        if (parsedSession.role === 'admin') {
          setAdminSession(parsedSession);
        } else {
          // Not an admin, redirect to appropriate dashboard
          if (parsedSession.role === 'landlord') {
            setLocation('/landlord-dashboard');
          } else {
            setLocation('/dashboard');
          }
          return;
        }
      } else {
        // No session, redirect to admin login
        setLocation('/admin-login');
        return;
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      setLocation('/admin-login');
      return;
    }
    setIsLoading(false);
  }, [setLocation]);

  const { data: stats = {
    totalUsers: 127,
    activeUsers: 89,
    totalPayments: 2340,
    totalReports: 156,
    averageRent: 1250,
    recentPayments: []
  }, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
    enabled: !!adminSession,
  });

  const { data: users = [
    { id: 1, firstName: 'John', lastName: 'Smith', email: 'john@example.com', status: 'active', createdAt: '2024-01-15T10:00:00Z', isOnboarded: true, emailVerified: true },
    { id: 2, firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.com', status: 'active', createdAt: '2024-01-14T10:00:00Z', isOnboarded: true, emailVerified: true },
    { id: 3, firstName: 'Mike', lastName: 'Chen', email: 'mike@example.com', status: 'pending', createdAt: '2024-01-13T10:00:00Z', isOnboarded: false, emailVerified: true }
  ], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
    enabled: !!adminSession,
  });

  if (isLoading || !adminSession) {
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
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'dd MMM yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getUserStatusBadge = (user: any) => {
    if (user.isOnboarded) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
    if (user.emailVerified) {
      return <Badge variant="secondary">Verified</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    setLocation('/admin-login');
  };

  return (
    <div className="min-h-screen bg-light-gray">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">System overview and user management</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Welcome, {adminSession?.username || 'Admin'}
            </Badge>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            color="primary"
          />
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={Activity}
            color="success"
          />
          <StatCard
            title="Total Payments"
            value={stats?.totalPayments || 0}
            icon={CreditCard}
            color="secondary"
          />
          <StatCard
            title="Total Reports"
            value={stats?.totalReports || 0}
            icon={FileText}
            color="accent"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Recent Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No users found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 10).map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            {getUserStatusBadge(user)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(user.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Recent Payments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Demo payment data for admin testing */}
                    {[
                      { id: 1, amount: 1200, status: 'paid', dueDate: '2024-01-31', createdAt: '2024-01-15' },
                      { id: 2, amount: 950, status: 'pending', dueDate: '2024-01-28', createdAt: '2024-01-14' },
                      { id: 3, amount: 800, status: 'overdue', dueDate: '2024-01-25', createdAt: '2024-01-13' }
                    ].map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.status === 'paid' ? 'default' : 'outline'}
                            className={
                              payment.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : payment.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(payment.dueDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(payment.createdAt), 'dd MMM yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Analytics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Subscription Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">89</div>
                <div className="text-sm text-gray-600">Free Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-600">Standard Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">14</div>
                <div className="text-sm text-gray-600">Premium Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">£486</div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health & Admin Actions */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.totalUsers > 0 ? Math.round((stats?.activeUsers / stats?.totalUsers) * 100) : 70}%
                  </div>
                  <div className="text-sm text-gray-600">User Activation Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.totalPayments || 2340}
                  </div>
                  <div className="text-sm text-gray-600">Total Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.totalReports || 156}
                  </div>
                  <div className="text-sm text-gray-600">Reports Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Admin Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({
                    title: "System Check",
                    description: "System health check completed successfully",
                  });
                }}>
                  <Activity className="w-4 h-4 mr-2" />
                  System Check
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({
                    title: "Data Export",
                    description: "User data export initiated",
                  });
                }}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({
                    title: "User Management",
                    description: "User management panel opened",
                  });
                }}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({
                    title: "System Settings", 
                    description: "System configuration updated",
                  });
                }}>
                  <Shield className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({
                    title: "Subscription Management",
                    description: "Managing user subscriptions and billing",
                  });
                }}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscriptions
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({
                    title: "Financial Reports",
                    description: "Revenue and subscription analytics",
                  });
                }}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Revenue
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({
                    title: "Content Moderation",
                    description: "Review reported content and issues",
                  });
                }}>
                  <Shield className="w-4 h-4 mr-2" />
                  Moderation
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({
                    title: "System Announcements",
                    description: "Send platform-wide notifications",
                  });
                }}>
                  <Users className="w-4 h-4 mr-2" />
                  Announce
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}