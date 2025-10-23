import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, CreditCard, FileText, Activity, Shield, TrendingUp, Download, AlertTriangle, MessageSquare, Settings2, MapPin, Check, X, Key, Edit, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPayments: number;
  totalReports: number;
  freeUsers: number;
  standardUsers: number;
  premiumUsers: number;
  monthlyRevenue: number;
}

interface AdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isOnboarded: boolean;
  emailVerified: boolean;
  subscriptionPlan: string;
  createdAt: string | null;
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  emailService: 'healthy' | 'degraded' | 'down';
  paymentProcessor: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [adminSession, setAdminSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [announcementText, setAnnouncementText] = useState("");
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const queryClient = useQueryClient();
  const [disputes, setDisputes] = useState([
    { id: 1, user: "John Smith", type: "Payment Dispute", status: "pending", date: "2024-01-20" },
    { id: 2, user: "Emma Wilson", type: "Verification Issue", status: "resolved", date: "2024-01-19" },
    { id: 3, user: "Michael Brown", type: "Account Access", status: "pending", date: "2024-01-18" },
  ]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editedPlan, setEditedPlan] = useState("");

  // Check for admin session
  useEffect(() => {
    try {
      const session = localStorage.getItem('admin_session');
      if (session) {
        const parsedSession = JSON.parse(session);
        if (parsedSession.role === 'admin') {
          setAdminSession(parsedSession);
        } else {
          if (parsedSession.role === 'landlord') {
            setLocation('/landlord-dashboard');
          } else {
            setLocation('/dashboard');
          }
          return;
        }
      } else {
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

  // Custom query function with admin headers
  const adminQuery = (url: string) => {
    return fetch(url, {
      headers: {
        'x-admin-session': JSON.stringify(adminSession),
      },
    }).then(res => {
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    });
  };

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => adminQuery("/api/admin/stats"),
    retry: false,
    enabled: !!adminSession,
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => adminQuery("/api/admin/users"),
    retry: false,
    enabled: !!adminSession,
  });

  // Fetch system health
  const { data: systemHealth, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ["/api/admin/system-health"],
    queryFn: () => adminQuery("/api/admin/system-health"),
    retry: false,
    enabled: !!adminSession,
    refetchInterval: 30000,
  });

  // Admin action mutations
  const systemCheckMutation = useMutation({
    mutationFn: () => 
      fetch('/api/admin/system-check', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "System Check Complete",
        description: "All systems are operating normally",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-health"] });
    },
    onError: () => {
      toast({
        title: "System Check Failed",
        description: "Some issues detected. Please review system logs.",
        variant: "destructive",
      });
    }
  });

  const dataExportMutation = useMutation({
    mutationFn: () => 
      fetch('/api/admin/export-all-data', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Data Export Started",
        description: "Export will be available for download shortly",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to initiate data export",
        variant: "destructive",
      });
    }
  });

  const handleDisputeAction = (disputeId: number, action: 'approve' | 'reject') => {
    // Update dispute status in state
    setDisputes(prev => prev.map(dispute => 
      dispute.id === disputeId 
        ? { ...dispute, status: action === 'approve' ? 'resolved' : 'rejected' }
        : dispute
    ));
    
    // In production, this would make an API call to update the dispute
    toast({
      title: action === 'approve' ? "Dispute Approved" : "Dispute Rejected",
      description: `Dispute #${disputeId} has been ${action === 'approve' ? 'resolved' : 'rejected'}.`,
    });
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditedPlan(user.subscriptionPlan || 'free');
    setShowEditDialog(true);
  };

  const handleResetPassword = (user: AdminUser) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordDialog(true);
  };

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string, planId: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, status: 'active' }),
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: `Subscription plan has been updated to ${editedPlan}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowEditDialog(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update subscription plan",
        variant: "destructive",
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string, newPassword: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset",
        description: `Password has been reset for ${selectedUser?.email}. New password: ${data.newPassword}`,
      });
      setShowPasswordDialog(false);
      setNewPassword("");
    },
    onError: () => {
      toast({
        title: "Reset Failed",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  });

  const handleSaveUserEdit = () => {
    if (!selectedUser) return;
    updateSubscriptionMutation.mutate({ userId: selectedUser.id, planId: editedPlan });
  };

  const handleSavePassword = () => {
    if (!selectedUser || !newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
  };

  const sendAnnouncementMutation = useMutation({
    mutationFn: (announcement: string) => 
      fetch('/api/admin/send-announcement', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: announcement }),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Announcement Sent",
        description: "System announcement has been sent to all users",
      });
      setAnnouncementText("");
      setShowAnnouncementDialog(false);
    },
    onError: () => {
      toast({
        title: "Failed to Send Announcement",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  });

  if (isLoading || !adminSession) {
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

  const formatDate = (dateString: string | null) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'dd MMM yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getUserStatusBadge = (user: AdminUser) => {
    if (user.isOnboarded) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
    if (user.emailVerified) {
      return <Badge variant="secondary">Verified</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getSystemHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-800">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">System overview and management</p>
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

        {/* System Health Alert */}
        {systemHealth && (systemHealth.database !== 'healthy' || systemHealth.emailService !== 'healthy' || systemHealth.paymentProcessor !== 'healthy') && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">System Issues Detected</h3>
            </div>
            <p className="text-yellow-700 mt-1">
              One or more system components are experiencing issues. Please review the system health section below.
            </p>
          </div>
        )}

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
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
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
                        <TableHead>Plan</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 10).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {user.email || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getUserStatusBadge(user)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              user.subscriptionPlan === 'premium' ? 'bg-purple-100 text-purple-800' :
                              user.subscriptionPlan === 'standard' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {user.subscriptionPlan || 'free'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEditUser(user)}
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => handleResetPassword(user)}
                                data-testid={`button-reset-password-${user.id}`}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  {systemHealth ? getSystemHealthBadge(systemHealth.database) : <Badge variant="outline">Checking...</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Service</span>
                  {systemHealth ? getSystemHealthBadge(systemHealth.emailService) : <Badge variant="outline">Checking...</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Processor</span>
                  {systemHealth ? getSystemHealthBadge(systemHealth.paymentProcessor) : <Badge variant="outline">Checking...</Badge>}
                </div>
                {systemHealth && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Last checked: {formatDate(systemHealth.lastChecked)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Analytics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Subscription Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.freeUsers || 0}</div>
                <div className="text-sm text-gray-600">Free Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.standardUsers || 0}</div>
                <div className="text-sm text-gray-600">Standard Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.premiumUsers || 0}</div>
                <div className="text-sm text-gray-600">Premium Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.monthlyRevenue ? formatCurrency(stats.monthlyRevenue) : '£0'}
                </div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disputes Management & Regional Activity */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Disputes Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Disputes Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm">{dispute.user}</p>
                        <Badge variant={dispute.status === 'pending' ? 'secondary' : 'default'} 
                               className={dispute.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                          {dispute.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{dispute.type}</p>
                      <p className="text-xs text-gray-500">Opened: {dispute.date}</p>
                    </div>
                    <div className="flex space-x-1">
                      {dispute.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleDisputeAction(dispute.id, 'approve')}
                            data-testid={`button-approve-dispute-${dispute.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDisputeAction(dispute.id, 'reject')}
                            data-testid={`button-reject-dispute-${dispute.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View All Disputes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Regional Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Regional Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { region: "London", users: 245, activity: 95 },
                  { region: "Manchester", users: 142, activity: 78 },
                  { region: "Birmingham", users: 98, activity: 65 },
                  { region: "Edinburgh", users: 76, activity: 54 },
                  { region: "Bristol", users: 63, activity: 42 },
                ].map((region) => (
                  <div key={region.region}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{region.region}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-blue-600">{region.users} users</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" 
                        style={{width: `${region.activity}%`}}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{region.activity}% activity rate</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Admin Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => systemCheckMutation.mutate()}
                disabled={systemCheckMutation.isPending}
              >
                <Activity className="w-4 h-4 mr-2" />
                System Check
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => dataExportMutation.mutate()}
                disabled={dataExportMutation.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setLocation('/admin/users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setLocation('/admin/settings')}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setLocation('/admin/subscriptions')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Subscriptions
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setLocation('/admin/revenue')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Revenue
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setLocation('/admin/moderation')}
              >
                <Shield className="w-4 h-4 mr-2" />
                Moderation
              </Button>
              
              <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Announce
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send System Announcement</DialogTitle>
                    <DialogDescription>
                      Send a platform-wide announcement to all users. This will create a notification for every active user.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="announcement">Announcement Message</Label>
                      <Textarea
                        id="announcement"
                        placeholder="Enter your announcement message..."
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAnnouncementDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => sendAnnouncementMutation.mutate(announcementText)}
                        disabled={!announcementText.trim() || sendAnnouncementMutation.isPending}
                      >
                        Send Announcement
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Modify user subscription plan and account settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>User Email</Label>
              <Input value={selectedUser?.email || ''} disabled className="mt-1" />
            </div>
            <div>
              <Label>User Name</Label>
              <Input 
                value={selectedUser?.firstName && selectedUser?.lastName 
                  ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                  : 'N/A'} 
                disabled 
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Subscription Plan</Label>
              <Select value={editedPlan} onValueChange={setEditedPlan}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="standard">Standard (£9.99/mo)</SelectItem>
                  <SelectItem value="premium">Premium (£19.99/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveUserEdit}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-user-edit"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Password</Label>
              <Input 
                type="text"
                placeholder="Enter new password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
                data-testid="input-new-password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters long
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The new password will be displayed once. Make sure to copy it and share it securely with the user.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSavePassword}
                className="bg-orange-600 hover:bg-orange-700"
                data-testid="button-save-password"
              >
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}