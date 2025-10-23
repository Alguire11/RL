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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, ArrowLeft, AlertTriangle, CheckCircle, XCircle, Flag, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface ModerationItem {
  id: string;
  type: 'user_report' | 'content_violation' | 'payment_dispute' | 'spam';
  userId: string;
  reporterId?: string;
  subject: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolution?: string;
}

export default function AdminModeration() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [adminSession, setAdminSession] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("");
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

  const { data: moderationItems = [], isLoading, refetch } = useQuery<ModerationItem[]>({
    queryKey: ["/api/admin/moderation"],
    queryFn: () => adminQuery("/api/admin/moderation"),
    retry: false,
    enabled: !!adminSession,
  });

  const resolveModerationMutation = useMutation({
    mutationFn: (data: { itemId: string; resolution: string; action: 'resolve' | 'dismiss' }) => 
      fetch('/api/admin/resolve-moderation', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Item Resolved",
        description: "Moderation item has been resolved successfully",
      });
      setShowResolveDialog(false);
      setSelectedItem(null);
      setResolution("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
    },
    onError: () => {
      toast({
        title: "Resolution Failed",
        description: "Failed to resolve moderation item",
        variant: "destructive",
      });
    }
  });

  const escalateModerationMutation = useMutation({
    mutationFn: (itemId: string) => 
      fetch('/api/admin/escalate-moderation', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Item Escalated",
        description: "Moderation item has been escalated to senior moderator",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
    },
    onError: () => {
      toast({
        title: "Escalation Failed",
        description: "Failed to escalate moderation item",
        variant: "destructive",
      });
    }
  });

  const filteredItems = moderationItems.filter(item => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesPriority = filterPriority === "all" || item.priority === filterPriority;
    return matchesStatus && matchesType && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'reviewing':
        return <Badge className="bg-blue-100 text-blue-800">Reviewing</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-800">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user_report':
        return <Flag className="w-4 h-4" />;
      case 'content_violation':
        return <AlertTriangle className="w-4 h-4" />;
      case 'payment_dispute':
        return <MessageSquare className="w-4 h-4" />;
      case 'spam':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  const handleResolve = (action: 'resolve' | 'dismiss') => {
    if (!selectedItem) return;
    
    resolveModerationMutation.mutate({
      itemId: selectedItem.id,
      resolution: resolution,
      action
    });
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
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
              </div>
              <p className="text-gray-600">Review and moderate user reports and content violations</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {moderationItems.filter(item => item.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {moderationItems.filter(item => item.priority === 'high' || item.priority === 'urgent').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {moderationItems.filter(item => 
                      item.status === 'resolved' && 
                      new Date(item.updatedAt).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{moderationItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Moderation Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Filter by Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="user_report">User Report</SelectItem>
                    <SelectItem value="content_violation">Content Violation</SelectItem>
                    <SelectItem value="payment_dispute">Payment Dispute</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Filter by Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Moderation Queue ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading moderation items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">All Clear!</h3>
                <p className="text-gray-500">No moderation items match your current filters.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(item.type)}
                          <span className="capitalize text-sm">{item.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{item.subject}</div>
                          <div className="text-sm text-gray-500 truncate">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span className="text-sm">{item.reporterId || item.userId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {(item.status === 'pending' || item.status === 'reviewing') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowResolveDialog(true);
                                }}
                              >
                                Review
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => escalateModerationMutation.mutate(item.id)}
                                disabled={escalateModerationMutation.isPending}
                              >
                                Escalate
                              </Button>
                            </>
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

        {/* Resolve Dialog */}
        <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Moderation Item</DialogTitle>
              <DialogDescription>
                Review the details and provide a resolution for this moderation item.
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getTypeIcon(selectedItem.type)}
                      <span className="capitalize">{selectedItem.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedItem.priority)}</div>
                  </div>
                </div>
                
                <div>
                  <Label>Subject</Label>
                  <div className="mt-1 font-medium">{selectedItem.subject}</div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <div className="mt-1 text-sm text-gray-600">{selectedItem.description}</div>
                </div>
                
                <div>
                  <Label htmlFor="resolution">Resolution Notes</Label>
                  <Textarea
                    id="resolution"
                    placeholder="Enter your resolution notes..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowResolveDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleResolve('dismiss')}
                    disabled={resolveModerationMutation.isPending}
                  >
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => handleResolve('resolve')}
                    disabled={!resolution.trim() || resolveModerationMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Resolve
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