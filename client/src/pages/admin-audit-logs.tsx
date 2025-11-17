import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowLeft, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { getQueryFn } from "@/lib/queryClient";

interface AuditLog {
  id: number;
  userId: string | null;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}

export default function AdminAuditLogs() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("all");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      setLocation('/admin-login');
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (userId) queryParams.append('userId', userId);
  if (action !== 'all') queryParams.append('action', action);

  const queryUrl = `/api/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const { data: logsData, isLoading } = useQuery<{ total: number; logs: AuditLog[] }>({
    queryKey: [queryUrl],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  if (authLoading || isLoading) {
    return <div>Loading...</div>;
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
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              </div>
              <p className="text-gray-600">View system audit trail and security logs</p>
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Filter by user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="action">Action Type</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="admin_user_updated">User Updated</SelectItem>
                    <SelectItem value="admin_user_suspended">User Suspended</SelectItem>
                    <SelectItem value="unauthorized_access_attempt">Unauthorized Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs ({logsData?.total || logsData?.logs?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsData?.logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.userId || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="font-mono text-sm">{log.ipAddress || 'N/A'}</TableCell>
                    <TableCell>
                      <pre className="text-xs bg-gray-50 p-2 rounded max-w-md overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

