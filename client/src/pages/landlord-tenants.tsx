import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, Phone, MapPin, Calendar, Plus, Send, MoreVertical } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { LandlordHeader } from "@/components/landlord-header";

export default function LandlordTenants() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { plan } = useSubscription();
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        propertyId: '',
    });

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'landlord') {
            setLocation('/landlord-login');
        }
    }, [authLoading, isAuthenticated, user, setLocation]);

    const { data: tenants, isLoading: tenantsLoading } = useQuery({
        queryKey: ['/api/landlord/tenants'],
    }) as { data: any[]; isLoading: boolean };

    const { data: properties } = useQuery({
        queryKey: ['/api/properties'],
    }) as { data: any[]; isLoading: boolean };

    const inviteTenantMutation = useMutation({
        mutationFn: async (data: { email: string; propertyId: number }) => {
            const property = properties?.find(p => p.id === data.propertyId);
            const response = await apiRequest("POST", "/api/landlord/invite-tenant", {
                email: data.email,
                propertyId: data.propertyId,
                propertyAddress: property?.address || '',
            });
            if (!response.ok) throw new Error('Failed to send invitation');
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Invitation Sent!",
                description: `Tenant invitation sent to ${inviteForm.email}`,
            });
            setInviteForm({ email: '', propertyId: '' });
            setShowInviteDialog(false);
            queryClient.invalidateQueries({ queryKey: ['/api/landlord/tenants'] });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to send invitation. Please try again.",
                variant: "destructive"
            });
        }
    });

    const handleInvite = () => {
        if (!inviteForm.email || !inviteForm.propertyId) {
            toast({
                title: "Missing Information",
                description: "Please fill in all fields",
                variant: "destructive"
            });
            return;
        }
        inviteTenantMutation.mutate({
            email: inviteForm.email,
            propertyId: parseInt(inviteForm.propertyId)
        });
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-white">
            <LandlordHeader user={user} plan={plan} activePage="tenants" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
                        <p className="text-gray-600 mt-2">Manage and communicate with your tenants</p>
                    </div>
                    <Button onClick={() => setShowInviteDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Invite Tenant
                    </Button>
                </div>

                {tenantsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : !tenants || tenants.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active tenants yet</h3>
                            <p className="text-gray-600 mb-4">Invite your first tenant to get started.</p>
                            <Button onClick={() => setShowInviteDialog(true)}>
                                <Send className="h-4 w-4 mr-2" />
                                Invite Tenant
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tenants.map((tenant: any) => (
                            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                                                    {tenant.firstName?.[0]}{tenant.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">{tenant.firstName} {tenant.lastName}</CardTitle>
                                                <CardDescription className="text-sm">
                                                    {tenant.isActive ? (
                                                        <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Inactive</Badge>
                                                    )}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                        {tenant.email}
                                    </div>
                                    {tenant.phone && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                            {tenant.phone}
                                        </div>
                                    )}
                                    {tenant.propertyAddress && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                            {tenant.propertyAddress}
                                        </div>
                                    )}
                                    {tenant.moveInDate && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                            Since {new Date(tenant.moveInDate).toLocaleDateString()}
                                        </div>
                                    )}
                                    <div className="pt-3 flex space-x-2">
                                        <Button variant="outline" size="sm" className="flex-1">
                                            <Mail className="h-3 w-3 mr-1" />
                                            Message
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1">
                                            View Profile
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Invite Tenant Dialog */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Tenant</DialogTitle>
                        <DialogDescription>
                            Send an invitation to a tenant to join your property on RentLedger.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Tenant Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tenant@example.com"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="property">Property</Label>
                            <Select
                                value={inviteForm.propertyId}
                                onValueChange={(value) => setInviteForm({ ...inviteForm, propertyId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a property" />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties?.map((property: any) => (
                                        <SelectItem key={property.id} value={property.id.toString()}>
                                            {property.address}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleInvite} disabled={inviteTenantMutation.isPending}>
                            {inviteTenantMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
