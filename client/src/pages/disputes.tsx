import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Plus, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

interface Dispute {
    id: number;
    type: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    resolution?: string;
}

export default function DisputesPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [formData, setFormData] = useState({
        type: "payment",
        subject: "",
        description: "",
        priority: "medium",
    });

    const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
        queryKey: ["/api/disputes/my"],
        queryFn: getQueryFn({ on401: "throw" }),
    });

    const createDisputeMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await apiRequest("POST", "/api/disputes", data);
            if (!response.ok) throw new Error("Failed to create dispute");
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Dispute Created",
                description: "Your dispute has been submitted successfully.",
            });
            setShowCreateDialog(false);
            setFormData({ type: "payment", subject: "", description: "", priority: "medium" });
            queryClient.invalidateQueries({ queryKey: ["/api/disputes/my"] });
        },
        onError: () => {
            toast({
                title: "Failed to Create Dispute",
                description: "Please try again later.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createDisputeMutation.mutate(formData);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open":
                return <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>;
            case "in_progress":
                return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
            case "resolved":
                return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
            case "closed":
                return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "urgent":
                return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
            case "high":
                return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
            case "medium":
                return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
            case "low":
                return <Badge className="bg-green-100 text-green-800">Low</Badge>;
            default:
                return <Badge variant="outline">{priority}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
            <Navigation />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="h-8 w-8 text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-900">My Disputes</h1>
                        </div>
                        <p className="text-gray-600 mt-1">Submit and track your payment and verification disputes</p>
                    </div>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                New Dispute
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Dispute</DialogTitle>
                                <DialogDescription>
                                    Submit a dispute for payment verification or other issues
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="type">Dispute Type</Label>
                                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="payment">Payment Issue</SelectItem>
                                            <SelectItem value="verification">Verification Issue</SelectItem>
                                            <SelectItem value="property">Property Issue</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Brief description of the issue"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Provide detailed information about your dispute..."
                                        rows={6}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createDisputeMutation.isPending}>
                                        {createDisputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Disputes</CardTitle>
                        <CardDescription>View and track the status of your submitted disputes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading disputes...</div>
                        ) : disputes.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No disputes submitted yet</p>
                                <Button
                                    className="mt-4"
                                    variant="outline"
                                    onClick={() => setShowCreateDialog(true)}
                                >
                                    Create Your First Dispute
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Updated</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {disputes.map((dispute) => (
                                        <TableRow key={dispute.id}>
                                            <TableCell className="font-medium">{dispute.subject}</TableCell>
                                            <TableCell className="capitalize">{dispute.type}</TableCell>
                                            <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                                            <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                                            <TableCell>{format(new Date(dispute.createdAt), "MMM dd, yyyy")}</TableCell>
                                            <TableCell>{format(new Date(dispute.updatedAt), "MMM dd, yyyy")}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
