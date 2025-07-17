import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Download, FileText, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface DataExportRequest {
  id: number;
  dataType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

export function DataExport() {
  const [dataType, setDataType] = useState("all");
  const { toast } = useToast();

  const { data: exportRequests = [], refetch } = useQuery<DataExportRequest[]>({
    queryKey: ["/api/user/export-requests"],
    retry: false,
  });

  const requestExportMutation = useMutation({
    mutationFn: async (dataType: string) => {
      const response = await apiRequest("POST", "/api/user/export-data", { dataType });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Export Requested",
        description: "Your data export request has been submitted. You'll be notified when it's ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/export-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Export Failed",
        description: "Failed to request data export. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExportRequest = () => {
    requestExportMutation.mutate(dataType);
  };

  const handleDownload = (request: DataExportRequest) => {
    if (request.downloadUrl) {
      window.open(request.downloadUrl, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <FileText className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const isExportExpired = (request: DataExportRequest) => {
    if (!request.expiresAt) return false;
    return new Date() > new Date(request.expiresAt);
  };

  return (
    <div className="space-y-6">
      {/* Export Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Request Data Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dataType">Data Type</Label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type to export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="payments">Payment History</SelectItem>
                  <SelectItem value="reports">Credit Reports</SelectItem>
                  <SelectItem value="profile">Profile Information</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Privacy Notice:</strong> Your data export will include all information associated with your account. 
                Sensitive data like bank account numbers will be masked for security. The export will be available for 7 days.
              </p>
            </div>

            <Button 
              onClick={handleExportRequest}
              disabled={requestExportMutation.isPending}
              className="w-full"
            >
              {requestExportMutation.isPending ? "Requesting..." : "Request Export"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Export History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exportRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No export requests yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.dataType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(request.createdAt), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {request.expiresAt ? (
                        <span className={isExportExpired(request) ? 'text-red-600' : ''}>
                          {format(new Date(request.expiresAt), 'dd MMM yyyy')}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {request.status === 'completed' && request.downloadUrl && !isExportExpired(request) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(request)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {isExportExpired(request) ? 'Expired' : 'Not ready'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}