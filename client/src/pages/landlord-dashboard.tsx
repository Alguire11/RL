import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, CheckCircle, Clock, Mail, Phone, MapPin, Star, TrendingUp, Calendar } from "lucide-react";

export default function LandlordDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminSession, setAdminSession] = useState<any>(null);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.role === 'landlord') {
        setAdminSession(parsed);
      } else {
        setLocation('/admin-login');
      }
    } else {
      setLocation('/admin-login');
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    setLocation('/admin-login');
  };

  const verificationRequests = [
    {
      id: 1,
      tenantName: "Sarah Johnson",
      tenantEmail: "sarah@example.com",
      property: "123 Main Street, London SW1A 1AA",
      requestDate: "2024-01-15",
      status: "pending",
      rentAmount: 1200,
      tenancyStart: "2023-06-01",
      tenancyEnd: "2024-05-31"
    },
    {
      id: 2,
      tenantName: "Michael Chen",
      tenantEmail: "michael@example.com",
      property: "456 Oak Avenue, Manchester M1 1AA",
      requestDate: "2024-01-12",
      status: "verified",
      rentAmount: 950,
      tenancyStart: "2023-08-01",
      tenancyEnd: "2024-07-31"
    },
    {
      id: 3,
      tenantName: "Emma Williams",
      tenantEmail: "emma@example.com",
      property: "789 Pine Road, Birmingham B1 1AA",
      requestDate: "2024-01-10",
      status: "rejected",
      rentAmount: 800,
      tenancyStart: "2023-09-01",
      tenancyEnd: "2024-08-31"
    }
  ];

  const stats = [
    { title: "Properties", value: "12", icon: Building, color: "text-blue-600" },
    { title: "Active Tenants", value: "18", icon: Users, color: "text-green-600" },
    { title: "Verifications", value: "8", icon: CheckCircle, color: "text-purple-600" },
    { title: "Pending Requests", value: "3", icon: Clock, color: "text-orange-600" }
  ];

  const handleVerification = (id: number, action: 'approve' | 'reject') => {
    toast({
      title: action === 'approve' ? "Verification Approved" : "Verification Rejected",
      description: `Tenant verification has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
    });
  };

  if (!adminSession) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
                <p className="text-gray-600">Welcome back, {adminSession.username}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Verification Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Tenant Verification Requests
              </CardTitle>
              <CardDescription>
                Review and approve tenant rental history verifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{request.tenantName}</h3>
                        <p className="text-sm text-gray-600">{request.tenantEmail}</p>
                        <p className="text-sm text-gray-500 mt-1">{request.property}</p>
                      </div>
                      <Badge 
                        variant={request.status === 'verified' ? 'default' : 
                                request.status === 'rejected' ? 'destructive' : 'secondary'}
                      >
                        {request.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Rent Amount:</span>
                        <span className="font-medium ml-2">£{request.rentAmount}/month</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Requested:</span>
                        <span className="font-medium ml-2">{request.requestDate}</span>
                      </div>
                    </div>

                    <div className="text-sm mb-3">
                      <span className="text-gray-600">Tenancy Period:</span>
                      <span className="font-medium ml-2">
                        {request.tenancyStart} to {request.tenancyEnd}
                      </span>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleVerification(request.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleVerification(request.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common landlord tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Building className="h-6 w-6 mb-2" />
                    <span className="text-sm">Add Property</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Tenants</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Mail className="h-6 w-6 mb-2" />
                    <span className="text-sm">Send Notice</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Calendar className="h-6 w-6 mb-2" />
                    <span className="text-sm">Schedule Inspection</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Sarah Johnson's verification approved</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">New tenant application received</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Monthly rent payment confirmed</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Property inspection scheduled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}