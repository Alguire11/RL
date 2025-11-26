import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { LandlordHeader } from "@/components/landlord-header";

export default function LandlordMaintenance() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { plan } = useSubscription();
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [responseMessage, setResponseMessage] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'landlord') {
            setLocation('/landlord-login');
        }
    }, [authLoading, isAuthenticated, user, setLocation]);

    const { data: maintenanceRequests, isLoading } = useQuery({
        queryKey: ['/api/landlord/maintenance-requests'],
    }) as { data: any[]; isLoading: boolean };

    const updateRequestMutation = useMutation({
        mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
            const response = await apiRequest("PATCH", `/api/maintenance-requests/${id}`, { status, notes });
            if (!response.ok) throw new Error('Failed to update request');
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Request Updated",
                description: "Maintenance request has been updated successfully.",
            });
            setSelectedRequest(null);
            setResponseMessage('');
            queryClient.invalidateQueries({ queryKey: ['/api/landlord/maintenance-requests'] });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update request.",
                variant: "destructive"
            });
        }
    });

    const handleUpdateStatus = (id: number, status: string) => {
        updateRequestMutation.mutate({ id, status, notes: responseMessage });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending' },
            'in-progress': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle, label: 'In Progress' },
            completed: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Completed' },
            rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <Badge variant="outline" className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            low: 'bg-gray-100 text-gray-700',
            medium: 'bg-orange-100 text-orange-700',
            high: 'bg-red-100 text-red-700',
            urgent: 'bg-red-200 text-red-900',
        };
        return (
            <Badge className={colors[priority as keyof typeof colors] || colors.low}>
                {priority?.toUpperCase()}
            </Badge>
        );
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-white">
            <LandlordHeader user={user} plan={plan} activePage="maintenance" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
                    <p className="text-gray-600 mt-2">Review and manage property maintenance requests</p>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : !maintenanceRequests || maintenanceRequests.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No maintenance requests</h3>
                            <p className="text-gray-600">When tenants submit maintenance requests, they will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {maintenanceRequests.map((request: any) => (
                            <Card key={request.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <Avatar>
                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                        {request.tenantName?.[0] || 'T'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-gray-900">{request.title || 'Maintenance Request'}</h3>
                                                        {getStatusBadge(request.status)}
                                                        {request.priority && getPriorityBadge(request.priority)}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{request.propertyAddress}</p>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                                <p className="text-sm text-gray-700">{request.description}</p>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Submitted</p>
                                                    <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Category</p>
                                                    <p className="font-medium capitalize">{request.category || 'General'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Tenant</p>
                                                    <p className="font-medium">{request.tenantName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Contact</p>
                                                    <p className="font-medium">{request.tenantPhone || request.tenantEmail}</p>
                                                </div>
                                            </div>

                                            {request.status === 'pending' && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <div className="space-y-3">
                                                        <Textarea
                                                            placeholder="Add a response or notes..."
                                                            value={responseMessage}
                                                            onChange={(e) => setResponseMessage(e.target.value)}
                                                            className="min-h-[80px]"
                                                        />
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700"
                                                                onClick={() => handleUpdateStatus(request.id, 'in-progress')}
                                                                disabled={updateRequestMutation.isPending}
                                                            >
                                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                                Mark In Progress
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleUpdateStatus(request.id, 'completed')}
                                                                disabled={updateRequestMutation.isPending}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Mark Complete
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                                                disabled={updateRequestMutation.isPending}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {request.notes && (
                                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-start space-x-2">
                                                        <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs text-blue-600 font-medium mb-1">Landlord Response</p>
                                                            <p className="text-sm text-gray-700">{request.notes}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
