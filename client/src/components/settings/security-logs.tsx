import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Monitor, Lock, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface SecurityLog {
  id: number;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata: any;
  createdAt: string;
}

export function SecurityLogs() {
  const { data: logs = [] } = useQuery<SecurityLog[]>({
    queryKey: ["/api/user/security-logs"],
    retry: false,
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'password_change':
      case 'preferences_updated':
        return <Lock className="h-4 w-4 text-green-600" />;
      case 'admin_access_denied':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'data_export_requested':
      case 'data_export_downloaded':
        return <Monitor className="h-4 w-4 text-purple-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    const dangerousActions = ['admin_access_denied', 'failed_login', 'suspicious_activity'];
    const warningActions = ['password_change', 'data_export_requested'];
    
    if (dangerousActions.includes(action)) {
      return <Badge variant="destructive">High Risk</Badge>;
    }
    if (warningActions.includes(action)) {
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    
    // Extract browser info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);
    
    if (browserMatch && osMatch) {
      return `${browserMatch[1]} on ${osMatch[1]}`;
    }
    
    return userAgent.length > 50 ? `${userAgent.slice(0, 50)}...` : userAgent;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No security logs yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      <span>{formatAction(log.action)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ipAddress || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatUserAgent(log.userAgent)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}