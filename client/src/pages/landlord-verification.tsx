import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Home, User, Calendar, PoundSterling, Phone, Mail, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import type { LandlordVerificationDetails } from "@/types/api";

export default function LandlordVerification() {
  const [location, setLocation] = useLocation();
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setVerificationToken(token);
    }
  }, []);

  const { data: verificationData, isLoading } = useQuery<LandlordVerificationDetails | null>({
    queryKey: ["/api/landlord-verification", verificationToken],
    enabled: !!verificationToken,
    retry: false,
  });

  const verifyRentalMutation = useMutation({
    mutationFn: async ({ token, status, notes }: { token: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const response = await apiRequest("POST", `/api/landlord-verification/verify`, {
        token,
        status,
        notes,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to verify rental");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Complete",
        description: data.status === 'approved' 
          ? "You have successfully verified this rental agreement."
          : "You have rejected this verification request.",
      });
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : "Failed to process verification. Please try again.";
      toast({
        title: "Verification Failed",
        description,
        variant: "destructive",
      });
    },
  });

  const landlordSignupMutation = useMutation({
    mutationFn: async (data: typeof signupData) => {
      const response = await apiRequest("POST", "/api/landlord/signup", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create account");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Created",
        description: "Your landlord account has been created successfully. You can now manage tenant verifications.",
      });
      setShowSignupDialog(false);
      setLocation('/landlord-dashboard');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : "Failed to create account. Please try again.";
      toast({
        title: "Signup Failed",
        description,
        variant: "destructive",
      });
    },
  });

  const handleVerification = (status: 'approved' | 'rejected', notes?: string) => {
    verifyRentalMutation.mutate({ token: verificationToken, status, notes });
  };

  const handleSignup = () => {
    landlordSignupMutation.mutate(signupData);
  };

  if (!verificationToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-900">Invalid Verification Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              The verification link you used is invalid or has expired.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-900">Verification Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              The verification request could not be found or has already been processed.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { property, tenant, verificationStatus } = verificationData || {};

  if (verificationStatus !== 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-green-900">Already Verified</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              This rental verification has already been {verificationStatus}.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rental Verification Request</h1>
          <p className="text-gray-600">
            Please review and verify the rental details below
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Property Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <p className="text-gray-900">{property.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Monthly Rent</Label>
                  <div className="flex items-center space-x-1">
                    <PoundSterling className="h-4 w-4" />
                    <span className="text-lg font-semibold">£{property.monthlyRent}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Deposit</Label>
                  <div className="flex items-center space-x-1">
                    <PoundSterling className="h-4 w-4" />
                    <span className="text-lg font-semibold">£{property.depositAmount || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Lease Start</Label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{property.leaseStartDate ? format(new Date(property.leaseStartDate), 'dd MMM yyyy') : 'Not provided'}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Lease End</Label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{property.leaseEndDate ? format(new Date(property.leaseEndDate), 'dd MMM yyyy') : 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {property.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-gray-900 text-sm">{property.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tenant Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Tenant Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p className="text-gray-900">{tenant.firstName || tenant.fullName} {tenant.lastName ?? ''}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{tenant.email}</span>
                </div>
              </div>

              {tenant.phone && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{tenant.phone}</span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-500">Verification Status</Label>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Pending Verification
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Verify Rental Details</CardTitle>
            <p className="text-sm text-gray-600">
              Please confirm if the above rental details are accurate
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => handleVerification('approved')}
                disabled={verifyRentalMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify & Approve
              </Button>
              
              <Button
                onClick={() => handleVerification('rejected')}
                disabled={verifyRentalMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Verification
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Want to manage multiple tenant verifications?
              </p>
              <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Create Landlord Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Landlord Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={signupData.firstName}
                          onChange={(e) => setSignupData({...signupData, firstName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={signupData.lastName}
                          onChange={(e) => setSignupData({...signupData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      />
                    </div>
                    <Button 
                      onClick={handleSignup}
                      disabled={landlordSignupMutation.isPending}
                      className="w-full"
                    >
                      {landlordSignupMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}