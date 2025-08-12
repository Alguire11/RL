import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CheckCircle, Plus, Trash2, Building, CreditCard, User, Bell, Shield, Download, Send, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { NotificationCenter } from "@/components/notification-system";
import { UserPreferences } from "@/components/settings/preferences";
import { DataExport } from "@/components/settings/data-export";
import { SecurityLogs } from "@/components/settings/security-logs";

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [notifications, setNotifications] = useState({
    paymentReminders: true,
    creditReports: true,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Set profile data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const { data: bankConnections } = useQuery({
    queryKey: ["/api/bank-connections"],
    retry: false,
  });

  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
    retry: false,
  });

  const { data: landlordVerifications } = useQuery({
    queryKey: ["/api/landlord-verifications"],
    retry: false,
  });

  const requestLandlordVerificationMutation = useMutation({
    mutationFn: async ({ propertyId, landlordEmail }: { propertyId: number; landlordEmail: string }) => {
      const response = await apiRequest("POST", "/api/landlord/verify-request", {
        propertyId,
        landlordEmail,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Request Sent",
        description: "Your landlord will receive an email to verify your rental history.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/landlord-verifications"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Request Failed",
        description: "Failed to send verification request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const disconnectBankMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const response = await apiRequest("DELETE", `/api/bank-connections/${connectionId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bank Disconnected",
        description: "Your bank connection has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to disconnect bank. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleDisconnectBank = (connectionId: number) => {
    disconnectBankMutation.mutate(connectionId);
  };

  const handleConnectBank = () => {
    // Mock Open Banking connection
    toast({
      title: "Connect Bank",
      description: "Open Banking connection would be initiated here",
    });
  };

  const handleLandlordVerificationRequest = (propertyId: number) => {
    const property = properties?.find((p: any) => p.id === propertyId);
    if (!property) return;

    const landlordEmail = prompt("Enter your landlord's email address:");
    if (!landlordEmail) return;

    requestLandlordVerificationMutation.mutate({
      propertyId,
      landlordEmail,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-gray">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl h-48"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    placeholder="Enter your last name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="gradient-primary text-white"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bank Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Bank Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bankConnections && bankConnections.length > 0 ? (
                  bankConnections.map((connection: any) => (
                    <div key={connection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">{connection.bankName}</p>
                          <p className="text-sm text-gray-600">
                            ****{connection.accountNumber.slice(-4)} • Connected
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnectBank(connection.id)}
                        disabled={disconnectBankMutation.isPending}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No bank connections yet</p>
                    <Button variant="outline" onClick={handleConnectBank}>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect Bank Account
                    </Button>
                  </div>
                )}
                {bankConnections && bankConnections.length > 0 && (
                  <Button variant="outline" onClick={handleConnectBank}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Bank
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties && properties.length > 0 ? (
                  properties.map((property: any) => (
                    <div key={property.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{property.address}</p>
                          <p className="text-sm text-gray-600">
                            {property.city}, {property.postcode}
                          </p>
                        </div>
                      </div>
                      <Badge variant={property.isActive ? 'default' : 'secondary'}>
                        {property.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No properties added yet</p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Property
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Reminders</p>
                    <p className="text-sm text-gray-600">Get notified before rent is due</p>
                  </div>
                  <Switch
                    checked={notifications.paymentReminders}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, paymentReminders: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Credit Reports</p>
                    <p className="text-sm text-gray-600">Updates on your credit building progress</p>
                  </div>
                  <Switch
                    checked={notifications.creditReports}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, creditReports: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  Export Data
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = "/api/logout"}
                >
                  Sign Out
                </Button>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
