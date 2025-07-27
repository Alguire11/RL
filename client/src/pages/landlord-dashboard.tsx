import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, CheckCircle, Clock, Mail, Phone, MapPin, Star, TrendingUp, Calendar, Plus, Send } from "lucide-react";

export default function LandlordDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminSession, setAdminSession] = useState<any>(null);
  
  // Dialog states
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showManageTenants, setShowManageTenants] = useState(false);
  const [showSendNotice, setShowSendNotice] = useState(false);
  const [showScheduleInspection, setShowScheduleInspection] = useState(false);
  
  // Form states
  const [propertyForm, setPropertyForm] = useState({
    address: '',
    type: '',
    bedrooms: '',
    bathrooms: '',
    rent: '',
    description: ''
  });
  
  const [noticeForm, setNoticeForm] = useState({
    tenant: '',
    subject: '',
    message: '',
    urgency: 'normal'
  });
  
  const [inspectionForm, setInspectionForm] = useState({
    property: '',
    date: '',
    time: '',
    type: 'routine',
    notes: ''
  });

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

  // Quick Action handlers
  const handleAddProperty = () => {
    toast({
      title: "Property Added",
      description: `${propertyForm.address} has been added to your portfolio.`,
    });
    setPropertyForm({
      address: '',
      type: '',
      bedrooms: '',
      bathrooms: '',
      rent: '',
      description: ''
    });
    setShowAddProperty(false);
  };

  const handleSendNotice = () => {
    toast({
      title: "Notice Sent",
      description: `Notice "${noticeForm.subject}" has been sent to ${noticeForm.tenant}.`,
    });
    setNoticeForm({
      tenant: '',
      subject: '',
      message: '',
      urgency: 'normal'
    });
    setShowSendNotice(false);
  };

  const handleScheduleInspection = () => {
    toast({
      title: "Inspection Scheduled",
      description: `${inspectionForm.type} inspection scheduled for ${inspectionForm.date} at ${inspectionForm.time}.`,
    });
    setInspectionForm({
      property: '',
      date: '',
      time: '',
      type: 'routine',
      notes: ''
    });
    setShowScheduleInspection(false);
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
                  <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200">
                        <Building className="h-6 w-6 mb-2" />
                        <span className="text-sm">Add Property</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Property</DialogTitle>
                        <DialogDescription>
                          Add a new property to your portfolio
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="address" className="text-right">
                            Address
                          </Label>
                          <Input
                            id="address"
                            value={propertyForm.address}
                            onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})}
                            className="col-span-3"
                            placeholder="123 Main Street, London"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type" className="text-right">
                            Type
                          </Label>
                          <Select value={propertyForm.type} onValueChange={(value) => setPropertyForm({...propertyForm, type: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="apartment">Apartment</SelectItem>
                              <SelectItem value="house">House</SelectItem>
                              <SelectItem value="studio">Studio</SelectItem>
                              <SelectItem value="townhouse">Townhouse</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="bedrooms" className="text-right">
                            Bedrooms
                          </Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            value={propertyForm.bedrooms}
                            onChange={(e) => setPropertyForm({...propertyForm, bedrooms: e.target.value})}
                            className="col-span-3"
                            placeholder="2"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="rent" className="text-right">
                            Rent (£/month)
                          </Label>
                          <Input
                            id="rent"
                            type="number"
                            value={propertyForm.rent}
                            onChange={(e) => setPropertyForm({...propertyForm, rent: e.target.value})}
                            className="col-span-3"
                            placeholder="1200"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAddProperty(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddProperty}>Add Property</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showManageTenants} onOpenChange={setShowManageTenants}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-200">
                        <Users className="h-6 w-6 mb-2" />
                        <span className="text-sm">Manage Tenants</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Tenant Management</DialogTitle>
                        <DialogDescription>
                          View and manage your tenants
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="space-y-4">
                          {verificationRequests.map((tenant) => (
                            <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <h4 className="font-semibold">{tenant.tenantName}</h4>
                                <p className="text-sm text-gray-600">{tenant.property}</p>
                                <p className="text-sm text-gray-500">£{tenant.rentAmount}/month</p>
                              </div>
                              <div className="space-x-2">
                                <Button size="sm" variant="outline">
                                  Contact
                                </Button>
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showSendNotice} onOpenChange={setShowSendNotice}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-orange-50 hover:border-orange-200">
                        <Mail className="h-6 w-6 mb-2" />
                        <span className="text-sm">Send Notice</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Send Notice to Tenant</DialogTitle>
                        <DialogDescription>
                          Send an official notice or communication
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="tenant" className="text-right">
                            Tenant
                          </Label>
                          <Select value={noticeForm.tenant} onValueChange={(value) => setNoticeForm({...noticeForm, tenant: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select tenant" />
                            </SelectTrigger>
                            <SelectContent>
                              {verificationRequests.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.tenantName}>
                                  {tenant.tenantName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subject" className="text-right">
                            Subject
                          </Label>
                          <Input
                            id="subject"
                            value={noticeForm.subject}
                            onChange={(e) => setNoticeForm({...noticeForm, subject: e.target.value})}
                            className="col-span-3"
                            placeholder="Rent reminder, Property inspection..."
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="urgency" className="text-right">
                            Urgency
                          </Label>
                          <Select value={noticeForm.urgency} onValueChange={(value) => setNoticeForm({...noticeForm, urgency: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="message" className="text-right pt-2">
                            Message
                          </Label>
                          <Textarea
                            id="message"
                            value={noticeForm.message}
                            onChange={(e) => setNoticeForm({...noticeForm, message: e.target.value})}
                            className="col-span-3"
                            placeholder="Enter your message..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowSendNotice(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSendNotice}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Notice
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showScheduleInspection} onOpenChange={setShowScheduleInspection}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-200">
                        <Calendar className="h-6 w-6 mb-2" />
                        <span className="text-sm">Schedule Inspection</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Schedule Property Inspection</DialogTitle>
                        <DialogDescription>
                          Schedule a routine or move-out inspection
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="property" className="text-right">
                            Property
                          </Label>
                          <Select value={inspectionForm.property} onValueChange={(value) => setInspectionForm({...inspectionForm, property: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {verificationRequests.map((req) => (
                                <SelectItem key={req.id} value={req.property}>
                                  {req.property}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="inspection-type" className="text-right">
                            Type
                          </Label>
                          <Select value={inspectionForm.type} onValueChange={(value) => setInspectionForm({...inspectionForm, type: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="routine">Routine</SelectItem>
                              <SelectItem value="move-in">Move-in</SelectItem>
                              <SelectItem value="move-out">Move-out</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="date" className="text-right">
                            Date
                          </Label>
                          <Input
                            id="date"
                            type="date"
                            value={inspectionForm.date}
                            onChange={(e) => setInspectionForm({...inspectionForm, date: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="time" className="text-right">
                            Time
                          </Label>
                          <Input
                            id="time"
                            type="time"
                            value={inspectionForm.time}
                            onChange={(e) => setInspectionForm({...inspectionForm, time: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="notes" className="text-right pt-2">
                            Notes
                          </Label>
                          <Textarea
                            id="notes"
                            value={inspectionForm.notes}
                            onChange={(e) => setInspectionForm({...inspectionForm, notes: e.target.value})}
                            className="col-span-3"
                            placeholder="Any special instructions or focus areas..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowScheduleInspection(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleScheduleInspection}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Inspection
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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