import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
    Building,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Mail,
    Users,
    CheckCircle,
    XCircle,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GradientButton } from "@/components/ui/gradient-button";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { LandlordHeader } from "@/components/landlord-header";
import { useSubscription } from "@/hooks/useSubscription";

export default function LandlordProperties() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const { plan } = useSubscription();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        address: "",
        city: "",
        postcode: "",
        type: "apartment",
        bedrooms: "",
        rentAmount: "",
        tenantName: "",
        tenantEmail: ""
    });

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'landlord') {
            setLocation('/landlord-login');
        }
    }, [authLoading, isAuthenticated, user, setLocation]);

    const { data: properties = [], isLoading } = useQuery({
        queryKey: ['/api/properties'],
        queryFn: getQueryFn({ on401: "throw" }),
    });

    const createPropertyMutation = useMutation({
        mutationFn: async (data: any) => {
            // 1. Create Property
            const res = await apiRequest("POST", "/api/properties", {
                address: `${data.address}, ${data.city}`,
                type: data.type,
                bedrooms: parseInt(data.bedrooms),
                rentAmount: parseFloat(data.rentAmount),
                postcode: data.postcode
            });
            const property = await res.json();

            // 2. Invite Tenant (if email provided)
            if (data.tenantEmail) {
                await apiRequest("POST", "/api/landlord/invite-tenant", {
                    email: data.tenantEmail,
                    propertyId: property.id,
                    propertyAddress: property.address
                });
            }

            return property;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
            setIsAddDialogOpen(false);
            setFormData({
                address: "",
                city: "",
                postcode: "",
                type: "apartment",
                bedrooms: "",
                rentAmount: "",
                tenantName: "",
                tenantEmail: ""
            });
            toast({
                title: "Property Added",
                description: "Property has been successfully added to your portfolio.",
            });

            if (formData.tenantEmail) {
                toast({
                    title: "Invitation Sent",
                    description: `Invitation sent to ${formData.tenantEmail}`,
                });
            }
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to add property",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPropertyMutation.mutate(formData);
    };

    const filteredProperties = Array.isArray(properties)
        ? properties.filter((p: any) =>
            p.address.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-white">
            <LandlordHeader user={user} plan={plan} activePage="properties" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
                        <p className="text-gray-600 mt-2">Manage your portfolio and tenants</p>
                    </div>
                    <GradientButton onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                    </GradientButton>
                </div>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search properties..."
                            className="pl-10 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="bg-white">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>

                {/* Properties Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
                        <p className="text-gray-500 mb-6">Get started by adding your first property.</p>
                        <Button onClick={() => setIsAddDialogOpen(true)}>Add Property</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((property: any) => (
                            <Card key={property.id} className="hover:shadow-md transition-shadow duration-200">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Building className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <Button variant="ghost" size="icon" className="-mr-2">
                                            <MoreVertical className="h-4 w-4 text-gray-400" />
                                        </Button>
                                    </div>
                                    <CardTitle className="mt-4 text-lg">{property.address}</CardTitle>
                                    <CardDescription>{property.type} • {property.bedrooms} Bed</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Monthly Rent</span>
                                            <span className="font-semibold">£{property.rentAmount}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">
                                                    {property.tenant ? "Occupied" : "Vacant"}
                                                </span>
                                            </div>
                                            {property.tenant ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-500">
                                                    No Tenant
                                                </Badge>
                                            )}
                                        </div>

                                        {!property.tenant && (
                                            <Button variant="outline" className="w-full mt-2 border-dashed">
                                                <Mail className="h-4 w-4 mr-2" />
                                                Invite Tenant
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Add Property Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add New Property</DialogTitle>
                        <DialogDescription>
                            Add a property to your portfolio and invite a tenant.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900">Property Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="address">Address Line 1</Label>
                                    <Input
                                        id="address"
                                        placeholder="123 Main St"
                                        required
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="London"
                                        required
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postcode">Postcode</Label>
                                    <Input
                                        id="postcode"
                                        placeholder="SW1A 1AA"
                                        required
                                        value={formData.postcode}
                                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="apartment">Apartment</SelectItem>
                                            <SelectItem value="house">House</SelectItem>
                                            <SelectItem value="studio">Studio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bedrooms">Bedrooms</Label>
                                    <Input
                                        id="bedrooms"
                                        type="number"
                                        min="0"
                                        required
                                        value={formData.bedrooms}
                                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rent">Rent (£/mo)</Label>
                                    <Input
                                        id="rent"
                                        type="number"
                                        min="0"
                                        required
                                        value={formData.rentAmount}
                                        onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">Tenant Invitation (Optional)</h4>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">Recommended</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tenantName">Tenant Name</Label>
                                    <Input
                                        id="tenantName"
                                        placeholder="John Doe"
                                        value={formData.tenantName}
                                        onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tenantEmail">Tenant Email</Label>
                                    <Input
                                        id="tenantEmail"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.tenantEmail}
                                        onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                We'll send an invitation email to your tenant with instructions to join RentLedger.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createPropertyMutation.isPending}>
                                {createPropertyMutation.isPending ? "Adding..." : "Add Property & Invite"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
