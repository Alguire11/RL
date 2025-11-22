import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, CheckCircle, Clock, Wrench } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function MaintenanceRequestsList({ landlordId }: { landlordId: string }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery({
        queryKey: ["/api/landlord", landlordId, "maintenance"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/landlord/${landlordId}/maintenance`);
            return res.json();
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiRequest("PATCH", `/api/maintenance/${id}`, { status });
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Status Updated",
                description: "Maintenance request status has been updated.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/landlord", landlordId, "maintenance"] });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        },
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open": return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Open</Badge>;
            case "in_progress": return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
            case "resolved": return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
            case "closed": return <Badge variant="outline">Closed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    if (!requests || requests.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Wrench className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No maintenance requests found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((req: any) => (
                <div key={req.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{req.title}</h3>
                            {getStatusBadge(req.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Property ID: {req.propertyId}</span>
                            <span>{format(new Date(req.createdAt), "MMM d, yyyy")}</span>
                            <span className="capitalize font-medium text-blue-600">{req.priority} Priority</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            defaultValue={req.status}
                            onValueChange={(val) => updateStatusMutation.mutate({ id: req.id, status: val })}
                            disabled={updateStatusMutation.isPending}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ))}
        </div>
    );
}
