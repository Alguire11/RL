import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Building, User, MapPin, PoundSterling, Shield } from "lucide-react";
import { Logo } from "@/components/logo";

interface VerificationData {
  user: {
    name: string;
    email: string;
  };
  property: {
    address: string;
    city: string;
    postcode: string;
    monthlyRent: string;
  };
  verification: {
    id: number;
    token: string;
  };
}

export default function LandlordVerify() {
  const [, params] = useRoute("/landlord/verify/:token");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { toast } = useToast();

  const { data: verificationData, isLoading, error } = useQuery<VerificationData>({
    queryKey: [`/api/landlord/verify/${params?.token}`],
    retry: false,
    enabled: !!params?.token,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/landlord/verify/${params?.token}/confirm`);
      return response.json();
    },
    onSuccess: () => {
      setIsConfirmed(true);
      toast({
        title: "Verification Confirmed",
        description: "Thank you for confirming the tenant's rental history.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to confirm verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification details...</p>
        </div>
      </div>
    );
  }

  if (error || !verificationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="mx-auto h-12 w-12 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Landlord Verification</h1>
          </div>
          
          <Alert variant="destructive">
            <AlertDescription>
              {error?.message || "Verification link not found or has expired. Please contact the tenant for a new verification link."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="mx-auto h-12 w-12 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Complete</h1>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Thank You!
                </h2>
                <p className="text-gray-600 mb-4">
                  You have successfully verified {verificationData.user.name}'s rental history.
                </p>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Verification Confirmed
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Logo className="mx-auto h-12 w-12 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Landlord Verification</h1>
          <p className="text-gray-600">
            Please verify the rental history for your tenant
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Tenant Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <p className="text-gray-900">{verificationData.user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{verificationData.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Property Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {verificationData.property.address}, {verificationData.property.city}, {verificationData.property.postcode}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Monthly Rent</label>
                <div className="flex items-center space-x-2">
                  <PoundSterling className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900 font-semibold">
                    {formatCurrency(verificationData.property.monthlyRent)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            By confirming this verification, you are attesting that the tenant information and property details above are accurate, and that you are the legitimate landlord for this property.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirm Tenant Verification
              </h2>
              <p className="text-gray-600 mb-6">
                Please confirm that {verificationData.user.name} is your tenant at the above property and that their rental payment history is accurate.
              </p>
              <Button 
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="w-full"
                size="lg"
              >
                {confirmMutation.isPending ? "Confirming..." : "Confirm Verification"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}