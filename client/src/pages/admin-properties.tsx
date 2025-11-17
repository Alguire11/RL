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
import { Building, ArrowLeft, Search } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

interface AdminProperty {
  id: number;
  userId: string;
  address: string;
  city: string;
  postcode: string;
  monthlyRent: string;
  landlordName: string | null;
  landlordEmail: string | null;
  isActive: boolean;
  createdAt: string | null;
}

export default function AdminProperties() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      setLocation('/admin-login');
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const { data: properties = [], isLoading } = useQuery<AdminProperty[]>({
    queryKey: ["/api/admin/properties"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const filteredProperties = properties.filter(prop =>
    prop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.postcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <Building className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Properties Management</h1>
              </div>
              <p className="text-gray-600">View and manage all properties in the system</p>
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by address, city, or postcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Properties ({filteredProperties.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Postcode</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.address}</TableCell>
                    <TableCell>{property.city}</TableCell>
                    <TableCell>{property.postcode}</TableCell>
                    <TableCell>£{property.monthlyRent}</TableCell>
                    <TableCell>{property.landlordName || property.landlordEmail || 'N/A'}</TableCell>
                    <TableCell>{property.isActive ? 'Active' : 'Inactive'}</TableCell>
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

