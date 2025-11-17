import { useEffect, useState, useRef, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, CheckCircle, Clock, Mail, Phone, MapPin, Star, TrendingUp, Calendar, Plus, Send, Link2, QrCode, Copy, FileText, Upload, Download, Award, BarChart3, Shield, Lock, Info, Sparkles, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function LandlordDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminSession, setAdminSession] = useState<any>(null);
  const [propertyCount, setPropertyCount] = useState(0);
  
  // Refs for scroll navigation
  const propertiesRef = useRef<HTMLDivElement>(null);
  const tenantsRef = useRef<HTMLDivElement>(null);
  const verificationsRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<HTMLDivElement>(null);
  
  // Invite tenant form
  const [tenantEmail, setTenantEmail] = useState('');
  const [selectedPropertyForInvite, setSelectedPropertyForInvite] = useState('');
  
  // Dialog states
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showManageTenants, setShowManageTenants] = useState(false);
  const [showSendNotice, setShowSendNotice] = useState(false);
  const [showScheduleInspection, setShowScheduleInspection] = useState(false);
  const [showInviteTenant, setShowInviteTenant] = useState(false);
  const [showDocumentVault, setShowDocumentVault] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState([
    { id: 1, name: "Tenancy Agreement - 123 Main St.pdf", type: "Contract", uploadDate: "2024-01-15", tenant: "Sarah Johnson", fileData: null as Blob | null },
    { id: 2, name: "Property Inspection Report - 456 Oak Ave.pdf", type: "Report", uploadDate: "2024-01-10", tenant: "Michael Chen", fileData: null as Blob | null },
    { id: 3, name: "Lease Renewal - 789 Pine Rd.pdf", type: "Contract", uploadDate: "2024-01-05", tenant: "Emma Williams", fileData: null as Blob | null },
  ]);
  
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

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { plan, hasFeature, isFreePlan, isStandardPlan, isPremiumPlan } = useSubscription();
  const planDisplayName = plan?.name ?? "Free";
  const maxPropertiesLimit = useMemo(() => {
    const limit = plan?.limits?.maxProperties;
    if (typeof limit === "number" || limit === Infinity) {
      return limit;
    }
    return Infinity;
  }, [plan]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'landlord') {
      setLocation('/landlord-login');
    } else {
      setAdminSession({ username: user.username || user.email || 'landlord', role: user.role });
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      setLocation('/landlord-login');
    } catch (error) {
      console.error('Logout error:', error);
      setLocation('/landlord-login');
    }
  };

  // Property mutations
  const addPropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      const response = await apiRequest("POST", "/api/properties", {
        userId: landlordId,
        address: propertyData.address,
        city: propertyData.city || '',
        postcode: propertyData.postcode || '',
        monthlyRent: propertyData.rent,
        ...propertyData
      });
      if (!response.ok) throw new Error('Failed to add property');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Property Added",
        description: `${propertyForm.address} has been added successfully.`,
      });
      setPropertyForm({ address: '', type: '', bedrooms: '', bathrooms: '', rent: '', description: '' });
      setShowAddProperty(false);
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add property. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/properties/${id}`, data);
      if (!response.ok) throw new Error('Failed to update property');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Property Updated", description: "Property updated successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update property.", variant: "destructive" });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/properties/${id}`, {});
      if (!response.ok) throw new Error('Failed to delete property');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Property Deleted", description: "Property deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete property.", variant: "destructive" });
    },
  });

  // Payment verification mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, status, notes }: { paymentId: number; status: 'approved' | 'rejected' | 'pending'; notes?: string }) => {
      const response = await apiRequest("POST", `/api/payments/${paymentId}/verify`, { status, notes });
      if (!response.ok) throw new Error('Failed to verify payment');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Payment Verified", description: "Payment status updated successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/landlord', landlordId, 'verifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/landlord', landlordId, 'pending-requests'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to verify payment.", variant: "destructive" });
    },
  });

  // Quick Action handlers
  const handleAddProperty = () => {
    // Check subscription limits based on active subscription plan
    const maxProperties = maxPropertiesLimit;
    
    if (propertyCount >= maxProperties) {
      toast({
        title: "Property Limit Reached",
        description: `Your ${planDisplayName} plan allows ${maxProperties === Infinity ? 'unlimited' : maxProperties} ${maxProperties === 1 ? 'property' : 'properties'}. Upgrade to add more.`,
        variant: "destructive",
      });
      return;
    }
    
    addPropertyMutation.mutate(propertyForm);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOC, or DOCX files only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDocumentUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    // Create new document entry with the actual file as a Blob
    const newDocument = {
      id: documents.length + 1,
      name: selectedFile.name,
      type: selectedFile.name.endsWith('.pdf') ? 'PDF' : 'Document',
      uploadDate: new Date().toISOString().split('T')[0],
      tenant: "Current Tenant", // In production, this would come from a form or context
      fileData: selectedFile as Blob
    };

    // Add to documents list (persisted in state for this session)
    setDocuments(prev => [newDocument, ...prev]);

    toast({
      title: "Document Uploaded",
      description: `${selectedFile.name} uploaded successfully`,
    });
    
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.getElementById('document-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleDocumentDownload = (docId: number, docName: string) => {
    // Find the document
    const doc = documents.find(d => d.id === docId);
    
    if (!doc || !doc.fileData) {
      // If no file data (mock documents), show a message
      toast({
        title: "Download Unavailable",
        description: "This is a sample document. Upload a real document to enable downloads.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(doc.fileData);
      const a = document.createElement('a');
      a.href = url;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${docName}...`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "An error occurred while downloading the file.",
        variant: "destructive",
      });
    }
  };

  // Calculate landlord badge tier
  const calculateBadgeTier = () => {
    const verificationRate = 85; // Mock: 85% verification rate
    const tenantSatisfaction = 4.5; // Mock: 4.5/5 satisfaction
    const totalVerifications = 8;

    if (verificationRate >= 80 && tenantSatisfaction >= 4.0 && totalVerifications >= 5) {
      return { tier: "Gold", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    } else if (verificationRate >= 60 && tenantSatisfaction >= 3.5) {
      return { tier: "Silver", color: "text-gray-600", bgColor: "bg-gray-100" };
    } else {
      return { tier: "Bronze", color: "text-orange-600", bgColor: "bg-orange-100" };
    }
  };

  const badgeTier = calculateBadgeTier();

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

  // API queries for tenant management
  const landlordId = adminSession?.username || 'landlord';
  
  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/landlord', landlordId, 'tenants'],
    enabled: !!adminSession
  });
  
  const { data: verifications = [] } = useQuery({
    queryKey: ['/api/landlord', landlordId, 'verifications'],
    enabled: !!adminSession
  });
  
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['/api/landlord', landlordId, 'pending-requests'],
    enabled: !!adminSession
  });
  
  const inviteTenantMutation = useMutation({
    mutationFn: async (data: { landlordId: string; propertyId: number | null; tenantEmail: string; landlordName: string; propertyAddress: string }) => {
      const response = await fetch('/api/landlord/invite-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send invitation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent!",
        description: `Tenant invitation sent to ${tenantEmail} with QR code.`,
      });
      setTenantEmail('');
      setSelectedPropertyForInvite('');
      setShowInviteTenant(false);
      queryClient.invalidateQueries({ queryKey: ['/api/landlord', landlordId, 'tenants'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const stats = [
    { title: "Properties", value: propertyCount.toString(), icon: Building, color: "text-blue-600" },
    { title: "Active Tenants", value: Array.isArray(tenants) ? tenants.length.toString() : "0", icon: Users, color: "text-green-600" },
    { title: "Verifications", value: Array.isArray(verifications) ? verifications.length.toString() : "0", icon: CheckCircle, color: "text-purple-600" },
    { title: "Pending Requests", value: Array.isArray(pendingRequests) ? pendingRequests.length.toString() : "0", icon: Clock, color: "text-orange-600" }
  ];

  const handleVerification = (id: number, action: 'approve' | 'reject') => {
    toast({
      title: action === 'approve' ? "Verification Approved" : "Verification Rejected",
      description: `Tenant verification has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
    });
  };

  // Handle stats card clicks - scroll to sections
  const handleStatsCardClick = (statTitle: string) => {
    switch(statTitle) {
      case 'Properties':
        propertiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'Active Tenants':
        tenantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'Verifications':
        verificationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'Pending Requests':
        pendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
    }
  };

  if (!adminSession) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
                <p className="text-gray-600">Welcome back, {adminSession.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 font-semibold">
                {plan?.name ?? "Free"} Plan
              </Badge>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        {showWelcome && (
          <Alert className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-lg font-semibold flex items-center justify-between">
              <span>Welcome to RentLedger Landlord Portal</span>
              <Button variant="ghost" size="sm" onClick={() => setShowWelcome(false)}>
                <span className="sr-only">Close</span>
                ×
              </Button>
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              <p className="mb-2">Your complete platform for tenant management and credit building verification.</p>
              <div className="grid md:grid-cols-3 gap-3 mt-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Verify tenant rental history</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Build your landlord reputation</span>
                </div>
                <div className="flex items-start space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-600 mt-0.5" />
                  <span>Track performance metrics</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Status & Upgrade Prompt */}
        {isFreePlan && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-lg font-semibold flex items-center justify-between">
              <span>You're on the Free Plan</span>
              <Badge variant="outline" className="bg-white">Limited Features</Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="text-sm mb-3">Upgrade to unlock advanced analytics, unlimited properties, and priority support.</p>
              <div className="flex items-center space-x-3">
                <Link href="/subscribe">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white dark:text-white font-semibold shadow-lg" data-testid="button-upgrade-premium">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to Premium - £19.99/mo
                  </Button>
                </Link>
                <Link href="/subscribe">
                  <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold" data-testid="button-view-plans">
                    View Plans
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Trusted Landlord Badge */}
        <Card className="mb-6 border-2" style={{borderColor: badgeTier.tier === 'Gold' ? '#ca8a04' : badgeTier.tier === 'Silver' ? '#71717a' : '#ea580c'}}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 ${badgeTier.bgColor} rounded-full flex items-center justify-center`}>
                  <Award className={`h-8 w-8 ${badgeTier.color}`} />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-2xl font-bold">{badgeTier.tier} Landlord</h3>
                    <Badge className={`${badgeTier.bgColor} ${badgeTier.color} border-0`}>
                      Trusted
                    </Badge>
                  </div>
                  <p className="text-gray-600">85% verification rate • 4.5/5 tenant satisfaction • 8 total verifications</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  {plan?.name ?? 'Free'} Plan
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Dashboard - Visible Section */}
        <Card className="mb-8 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Performance Analytics
                  {!hasFeature('advancedAnalytics') && (
                    <Badge variant="outline" className="ml-3 text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Limited in Free Plan
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Real-time insights into your landlord performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Verification Rate</p>
                  <p className="text-3xl font-bold text-green-600">85%</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    ↑ 5% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                  <p className="text-3xl font-bold text-blue-600">2.3h</p>
                  <p className="text-xs text-gray-500 mt-1">↓ 0.5h faster</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Tenant Satisfaction</p>
                  <p className="text-3xl font-bold text-purple-600">4.5/5</p>
                  <p className="text-xs text-gray-500 mt-1">Based on 18 reviews</p>
                </CardContent>
              </Card>
            </div>
            
            {!hasFeature('advancedAnalytics') ? (
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">Unlock Advanced Analytics</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get detailed trends, property performance insights, and tenant behavior analysis with Premium.
                </p>
                <Link href="/subscribe">
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white dark:text-white font-semibold shadow-lg" data-testid="button-upgrade-analytics">
                    Upgrade Now <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Monthly Verification Trends</span>
                  </div>
                  <div className="space-y-2">
                    {['January', 'February', 'March'].map((month, idx) => (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{month}</span>
                          <span className="text-sm font-semibold">{12 + idx * 2} verifications</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: `${60 + idx * 15}%`}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid - Clickable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card 
              key={stat.title}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-md"
              onClick={() => handleStatsCardClick(stat.title)}
              data-testid={`card-stat-${stat.title.toLowerCase().replace(' ', '-')}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-br ${
                    stat.title === 'Properties' ? 'from-blue-100 to-blue-200' :
                    stat.title === 'Active Tenants' ? 'from-green-100 to-green-200' :
                    stat.title === 'Verifications' ? 'from-purple-100 to-purple-200' :
                    'from-orange-100 to-orange-200'
                  } ${stat.color}`}>
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
                  <Dialog open={showInviteTenant} onOpenChange={setShowInviteTenant}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-200"
                      >
                        <Link2 className="h-6 w-6 mb-2" />
                        <span className="text-sm">Invite Tenant</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center text-xl">
                          <Link2 className="h-5 w-5 mr-2 text-purple-600" />
                          Invite Tenant
                        </DialogTitle>
                        <DialogDescription>
                          Send an invitation email with QR code to your tenant
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="quick-tenant-email">Tenant Email</Label>
                          <Input
                            id="quick-tenant-email"
                            type="email"
                            value={tenantEmail}
                            onChange={(e) => setTenantEmail(e.target.value)}
                            placeholder="tenant@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="quick-property-address">Property Address</Label>
                          <Input
                            id="quick-property-address"
                            value={selectedPropertyForInvite}
                            onChange={(e) => setSelectedPropertyForInvite(e.target.value)}
                            placeholder="123 Main Street, London"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowInviteTenant(false)}>Cancel</Button>
                        <Button 
                          onClick={() => {
                            if (!tenantEmail || !selectedPropertyForInvite) {
                              toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
                              return;
                            }
                            inviteTenantMutation.mutate({
                              landlordId,
                              propertyId: null,
                              tenantEmail,
                              landlordName: adminSession.username,
                              propertyAddress: selectedPropertyForInvite
                            });
                          }}
                          disabled={inviteTenantMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white dark:text-white"
                        >
                          {inviteTenantMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 relative">
                        <Building className="h-6 w-6 mb-2" />
                        <span className="text-sm">Add Property</span>
                        {maxPropertiesLimit !== Infinity && (
                          <Badge variant="outline" className="absolute -top-2 -right-2 text-[10px] px-1">
                            {maxPropertiesLimit} max
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Property</DialogTitle>
                        <DialogDescription>
                          Add a new property to your portfolio
                          {isFreePlan && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Free: 1 property max
                            </Badge>
                          )}
                          {isStandardPlan && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Standard: 3 properties max
                            </Badge>
                          )}
                          {isPremiumPlan && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Premium: Unlimited properties
                            </Badge>
                          )}
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

                  <Dialog open={showDocumentVault} onOpenChange={setShowDocumentVault}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-indigo-50 hover:border-indigo-200">
                        <FileText className="h-6 w-6 mb-2" />
                        <span className="text-sm">Document Vault</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center text-xl">
                          <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                          Document Vault
                        </DialogTitle>
                        <DialogDescription>
                          Manage tenancy agreements and property documents
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="p-4 border-2 border-dashed rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Upload className="h-8 w-8 text-gray-400" />
                              <div>
                                <p className="font-medium">Upload New Document</p>
                                <p className="text-sm text-gray-500">PDF, DOC, or DOCX (max 10MB)</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="document-upload"
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileSelect}
                              className="flex-1"
                            />
                            <Button onClick={handleDocumentUpload} disabled={!selectedFile}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                          {selectedFile && (
                            <p className="text-sm text-green-600 mt-2">
                              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700">Recent Documents</h4>
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <p className="text-xs text-gray-500">{doc.tenant} • {doc.uploadDate}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDocumentDownload(doc.id, doc.name)}
                                  data-testid={`button-download-doc-${doc.id}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
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

            {/* Active Tenants Section */}
            <div ref={tenantsRef} id="active-tenants">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Active Tenants</span>
                    <Dialog open={showInviteTenant} onOpenChange={setShowInviteTenant}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white dark:text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Invite Tenant
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Tenant</DialogTitle>
                          <DialogDescription>Send an invitation email with QR code to your tenant</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="tenant-email">Tenant Email</Label>
                            <Input
                              id="tenant-email"
                              type="email"
                              value={tenantEmail}
                              onChange={(e) => setTenantEmail(e.target.value)}
                              placeholder="tenant@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="property-address">Property Address</Label>
                            <Input
                              id="property-address"
                              value={selectedPropertyForInvite}
                              onChange={(e) => setSelectedPropertyForInvite(e.target.value)}
                              placeholder="123 Main Street, London"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowInviteTenant(false)}>Cancel</Button>
                          <Button 
                            onClick={() => {
                              if (!tenantEmail || !selectedPropertyForInvite) {
                                toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
                                return;
                              }
                              inviteTenantMutation.mutate({
                                landlordId,
                                propertyId: null,
                                tenantEmail,
                                landlordName: adminSession.username,
                                propertyAddress: selectedPropertyForInvite
                              });
                            }}
                            disabled={inviteTenantMutation.isPending}
                          >
                            {inviteTenantMutation.isPending ? "Sending..." : "Send Invitation"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                  <CardDescription>Manage and communicate with your tenants</CardDescription>
                </CardHeader>
                <CardContent>
                  {!Array.isArray(tenants) || tenants.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No active tenants yet. Invite your first tenant!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tenants.map((tenantData: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <Avatar>
                                <AvatarFallback>{tenantData.tenant?.name?.[0] || 'T'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{tenantData.tenant?.name || 'Unknown Tenant'}</h4>
                                <p className="text-sm text-gray-600">{tenantData.property?.address || 'Unknown Property'}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {tenantData.payments?.length || 0} payment{tenantData.payments?.length !== 1 ? 's' : ''} recorded
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline"><Mail className="h-4 w-4 mr-1" />Contact</Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  // Download PDF ledger
                                  const tenantId = tenantData.tenant?.id || 'unknown';
                                  window.open(`/api/landlord/${landlordId}/tenant/${tenantId}/ledger-pdf`, '_blank');
                                  toast({
                                    title: "Downloading PDF",
                                    description: "Rent ledger PDF is being generated...",
                                  });
                                }}
                                data-testid={`button-download-ledger-${idx}`}
                              >
                                <Download className="h-4 w-4 mr-1" />Download Ledger
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Verifications Section */}
            <div ref={verificationsRef} id="verifications">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Verifications</CardTitle>
                  <CardDescription>Review and verify tenant payment records</CardDescription>
                </CardHeader>
                <CardContent>
                  {!Array.isArray(verifications) || verifications.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No payment verifications to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {verifications.map((payment: any) => (
                        <div key={payment.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">Payment #{payment.id}</h4>
                              <p className="text-sm text-gray-600">Amount: £{payment.amount}</p>
                              <p className="text-sm text-gray-500">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                              <Badge className={payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {payment.status}
                              </Badge>
                            </div>
                            {payment.status === 'pending' && (
                              <div className="space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-green-600 dark:text-green-400"
                                  onClick={() => verifyPaymentMutation.mutate({ paymentId: payment.id, status: 'approved' })}
                                  disabled={verifyPaymentMutation.isPending}
                                  data-testid={`button-approve-payment-${payment.id}`}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => verifyPaymentMutation.mutate({ paymentId: payment.id, status: 'rejected' })}
                                  disabled={verifyPaymentMutation.isPending}
                                  data-testid={`button-reject-payment-${payment.id}`}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pending Requests Section */}
            <div ref={pendingRef} id="pending-requests">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>Review pending tenant requests and verifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {!Array.isArray(pendingRequests) || pendingRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No pending requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request: any) => (
                        <div key={request.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline">{request.type.replace('_', ' ')}</Badge>
                                <span className="text-sm text-gray-500">#{request.id}</span>
                              </div>
                              <h4 className="font-semibold">{request.tenant?.name || 'Unknown Tenant'}</h4>
                              <p className="text-sm text-gray-600">{request.property?.address || 'Unknown Property'}</p>
                              {request.data && (
                                <p className="text-sm text-gray-500 mt-1">Amount: £{request.data.amount}</p>
                              )}
                            </div>
                            <div className="space-x-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white dark:text-white"
                                onClick={() => {
                                  if (request.data?.paymentId) {
                                    verifyPaymentMutation.mutate({ paymentId: request.data.paymentId, status: 'approved' });
                                  }
                                }}
                                disabled={verifyPaymentMutation.isPending}
                                data-testid={`button-approve-request-${request.id}`}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 dark:text-red-400"
                                onClick={() => {
                                  if (request.data?.paymentId) {
                                    verifyPaymentMutation.mutate({ paymentId: request.data.paymentId, status: 'rejected' });
                                  }
                                }}
                                disabled={verifyPaymentMutation.isPending}
                                data-testid={`button-decline-request-${request.id}`}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div ref={propertiesRef} id="properties">
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

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Analytics Snapshot
            </DialogTitle>
            <DialogDescription>
              Comprehensive overview of your landlord performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Verification Rate</p>
                  <p className="text-3xl font-bold text-green-600">85%</p>
                  <p className="text-xs text-gray-500 mt-1">↑ 5% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                  <p className="text-3xl font-bold text-blue-600">2.3h</p>
                  <p className="text-xs text-gray-500 mt-1">↓ 0.5h from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Tenant Satisfaction</p>
                  <p className="text-3xl font-bold text-purple-600">4.5/5</p>
                  <p className="text-xs text-gray-500 mt-1">Based on 18 reviews</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Verification Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">January</span>
                      <span className="text-sm font-semibold">12 verifications</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '80%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">February</span>
                      <span className="text-sm font-semibold">15 verifications</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">March</span>
                      <span className="text-sm font-semibold">10 verifications</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '67%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">123 Main Street, London</p>
                        <p className="text-xs text-gray-500">100% on-time payments • 5.0 rating</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">456 Oak Avenue, Manchester</p>
                        <p className="text-xs text-gray-500">95% on-time payments • 4.8 rating</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Great</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badge Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Badge Tier Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current: {badgeTier.tier}</span>
                      <span className="text-sm text-gray-500">Next: Platinum</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">15% away from Platinum tier</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Verification Rate</p>
                      <p className="text-sm font-semibold text-green-600">85%</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Satisfaction</p>
                      <p className="text-sm font-semibold text-blue-600">4.5/5</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Total Verifications</p>
                      <p className="text-sm font-semibold text-purple-600">8</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}