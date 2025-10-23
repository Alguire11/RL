import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, UserCheck, UserX, Crown, ArrowLeft, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface AdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isOnboarded: boolean;
  emailVerified: boolean;
  subscriptionPlan: string;
  subscriptionStatus: string;
  role: string;
  phone: string | null;
  createdAt: string | null;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [adminSession, setAdminSession] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const session = localStorage.getItem('admin_session');
      if (session) {
        const parsedSession = JSON.parse(session);
        if (parsedSession.role === 'admin') {
          setAdminSession(parsedSession);
        } else {
          setLocation('/admin-login');
          return;
        }
      } else {
        setLocation('/admin-login');
        return;
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      setLocation('/admin-login');
    }
  }, [setLocation]);

  const adminQuery = (url: string) => {
    return fetch(url, {
      headers: { 'x-admin-session': JSON.stringify(adminSession) },
    }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    });
  };

  const { data: users = [], isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => adminQuery("/api/admin/users"),
    retry: false,
    enabled: !!adminSession,
  });

  const updateUserMutation = useMutation({
    mutationFn: (userData: { userId: string; updates: any }) => 
      fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User information has been updated successfully",
      });
      setShowEditDialog(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user information",
        variant: "destructive",
      });
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: (userId: string) => 
      fetch('/api/admin/suspend-user', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "User Suspended",
        description: "User has been suspended successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Suspension Failed",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && user.isOnboarded) ||
      (filterStatus === "verified" && user.emailVerified) ||
      (filterStatus === "pending" && !user.emailVerified);
    
    const matchesPlan = filterPlan === "all" || user.subscriptionPlan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getUserStatusBadge = (user: AdminUser) => {
    if (user.isOnboarded) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
    if (user.emailVerified) {
      return <Badge variant="secondary">Verified</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getSubscriptionBadge = (plan: string) => {
    switch (plan) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      case 'standard':
        return <Badge className="bg-blue-100 text-blue-800">Standard</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'dd MMM yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  if (!adminSession) {
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
                <Users className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              </div>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Users ({filteredUsers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.firstName && user.lastName ? 
                            `${user.firstName} ${user.lastName}` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{user.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getUserStatusBadge(user)}</TableCell>
                      <TableCell>{getSubscriptionBadge(user.subscriptionPlan)}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditDialog(true);
                            }}
                          >
                            <UserCheck className="w-3 h-3" />
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => suspendUserMutation.mutate(user.id)}
                              disabled={suspendUserMutation.isPending}
                            >
                              <UserX className="w-3 h-3" />
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

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      defaultValue={selectedUser.firstName || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      defaultValue={selectedUser.lastName || ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={selectedUser.email || ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan">Subscription Plan</Label>
                    <Select defaultValue={selectedUser.subscriptionPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue={selectedUser.role}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="landlord">Landlord</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Implementation would collect form data and call updateUserMutation
                      toast({
                        title: "Feature Coming Soon",
                        description: "User editing functionality will be available soon",
                      });
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}