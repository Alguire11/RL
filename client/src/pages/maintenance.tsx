import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Wrench, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function MaintenancePage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "medium",
        propertyId: "", // This should be auto-selected or fetched from user's lease
    });

    // Fetch user's maintenance requests
    const { data: requests, isLoading } = useQuery<any[]>({
        queryKey: ["/api/maintenance"],
    });

    // Fetch user's properties (to select which property the request is for)
    // Assuming the user is a tenant, they might have one active property.
    // For now, we'll fetch the user's profile or lease info to get the property ID.
    // This part depends on how we link tenants to properties. 
    // If we don't have a direct "my-property" endpoint, we might need to rely on the backend to infer it 
    // or fetch it from a "current-lease" endpoint.
    // For this implementation, let's assume the backend handles the property association 
    // or we fetch it here. Let's try to fetch "my-lease" or similar if it exists, 
    // otherwise we might need to ask the user to select if they have multiple (rare for tenants).

    // Simplified: We'll let the user select from a list if they have multiple, 
    // or just default to their primary residence if the backend knows it.
    // For now, let's assume the backend infers it from the tenant's active lease. 
    // If not, we'll need to add a property selector.

    // Let's check if we can get the property ID from the user object or a separate call.
    // Since I don't have a clear "get my property" endpoint in the plan, 
    // I'll assume for now the backend assigns the property based on the tenant's active lease.
    // If the tenant is not assigned to a property, this might fail.
    // I'll add a propertyId field to the form but hide it if we can infer it, 
    // or show a "No property assigned" error.

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            // We need a propertyId. If the user is a tenant, they must be linked to a property.
            // Let's assume we pass a dummy ID or the backend handles it if missing.
            // Actually, the schema requires propertyId.
            // Let's fetch the tenant's current property first.
            const res = await apiRequest("POST", "/api/maintenance", data);
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Request Submitted",
                description: "Your maintenance request has been sent to the landlord.",
            });
            setShowForm(false);
            setFormData({ title: "", description: "", priority: "medium", propertyId: "" });
            queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to submit request",
                variant: "destructive",
            });
        },
    });

    // We need to get the property ID. 
    // Let's try to fetch the user's details which might have the property ID 
    // or fetch "my-property".
    const { data: user } = useQuery({ queryKey: ["/api/user"] });

    // If we can't find a property, we can't submit a request.
    // Let's assume the user object has a 'properties' array or similar if they are a tenant?
    // Or maybe we need to fetch their leases.
    // Given the constraints, I'll try to fetch the tenant's property via a new query or existing one.
    // Let's assume for now we can get it. If not, I'll add a TODO.

    // WORKAROUND: We'll fetch the user's rent payments to find the property ID they usually pay for.
    const { data: payments } = useQuery<any[]>({ queryKey: ["/api/payments"] });
    const propertyId = payments?.[0]?.propertyId;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!propertyId) {
            toast({
                title: "Error",
                description: "Could not identify your property. Please contact support.",
                variant: "destructive",
            });
            return;
        }
        createMutation.mutate({ ...formData, propertyId });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open": return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Open</Badge>;
            case "in_progress": return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
            case "resolved": return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
            case "closed": return <Badge variant="outline">Closed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "text-red-600 font-bold";
            case "high": return "text-orange-600 font-semibold";
            case "medium": return "text-blue-600";
            default: return "text-gray-600";
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wrench className="h-8 w-8" />
                        Maintenance Requests
                    </h1>
                    <p className="text-gray-500 mt-2">Report and track repairs for your property</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Request</>}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-8 animate-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle>New Maintenance Request</CardTitle>
                        <CardDescription>Describe the issue in detail. Uploading photos helps speed up the process.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Issue Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Leaking Faucet"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(val) => setFormData({ ...formData, priority: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low - Cosmetic or minor</SelectItem>
                                        <SelectItem value="medium">Medium - Affects daily use</SelectItem>
                                        <SelectItem value="high">High - Urgent repair needed</SelectItem>
                                        <SelectItem value="urgent">Urgent - Safety hazard / Emergency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Please describe the issue..."
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={createMutation.isPending || !propertyId}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                            {!propertyId && <p className="text-sm text-red-500">No property linked to your account.</p>}
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                ) : requests?.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Wrench className="h-12 w-12 mb-4 opacity-20" />
                            <p>No maintenance requests found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    requests?.map((req: any) => (
                        <Card key={req.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-lg">{req.title}</h3>
                                            {getStatusBadge(req.status)}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 mb-4">{req.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {format(new Date(req.createdAt), "MMM d, yyyy")}
                                            </span>
                                            <span className={`capitalize ${getPriorityColor(req.priority)}`}>
                                                {req.priority} Priority
                                            </span>
                                        </div>
                                    </div>
                                    {/* Actions or details button could go here */}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
