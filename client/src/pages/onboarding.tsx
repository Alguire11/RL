import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  CreditCard, 
  Building, 
  Calendar, 
  PoundSterling, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  Banknote
} from "lucide-react";

const rentDetailsSchema = z.object({
  monthlyRent: z.string().min(1, "Monthly rent is required"),
  paymentDay: z.string().min(1, "Payment day is required"),
  landlordName: z.string().optional(),
  landlordEmail: z.string().email().optional().or(z.literal("")),
  firstPaymentDate: z.string().min(1, "First payment date is required"),
});

const bankConnectionSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountType: z.string().min(1, "Account type is required"),
  sortCode: z.string().min(6, "Sort code must be 6 digits").max(6),
  accountNumber: z.string().min(8, "Account number must be at least 8 digits"),
});

type RentDetailsData = z.infer<typeof rentDetailsSchema>;
type BankConnectionData = z.infer<typeof bankConnectionSchema>;

const steps = [
  { id: 1, title: "Welcome", description: "Get started with Enoíkio" },
  { id: 2, title: "Bank Connection", description: "Connect your bank securely" },
  { id: 3, title: "Rent Details", description: "Set up your rent information" },
  { id: 4, title: "Complete", description: "Start tracking your payments" },
];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const rentForm = useForm<RentDetailsData>({
    resolver: zodResolver(rentDetailsSchema),
    defaultValues: {
      monthlyRent: "",
      paymentDay: "1",
      landlordName: "",
      landlordEmail: "",
      firstPaymentDate: "",
    },
  });

  const bankForm = useForm<BankConnectionData>({
    resolver: zodResolver(bankConnectionSchema),
    defaultValues: {
      bankName: "",
      accountType: "current",
      sortCode: "",
      accountNumber: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const createBankConnectionMutation = useMutation({
    mutationFn: async (data: BankConnectionData) => {
      const response = await apiRequest("POST", "/api/bank-connections", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to connect bank");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
      toast({
        title: "Bank Connected",
        description: "Your bank account has been connected successfully.",
      });
      setCurrentStep(3);
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRentInfoMutation = useMutation({
    mutationFn: async (data: RentDetailsData) => {
      const rentData = {
        amount: parseFloat(data.monthlyRent),
        dayOfMonth: parseInt(data.paymentDay),
        frequency: "monthly",
        firstPaymentDate: data.firstPaymentDate,
        nextPaymentDate: calculateNextPayment(data.paymentDay),
      };
      
      const response = await apiRequest("PUT", "/api/user/rent-info", rentData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save rent details");
      }
      return response.json();
    },
    onSuccess: () => {
      updateProfileMutation.mutate({ isOnboarded: true });
      toast({
        title: "Onboarding Complete!",
        description: "Welcome to Enoíkio. You can now start tracking your rent payments.",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateNextPayment = (day: string) => {
    const today = new Date();
    const paymentDay = parseInt(day);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay);
    return nextMonth.toISOString().split('T')[0];
  };

  const onBankConnect = (data: BankConnectionData) => {
    createBankConnectionMutation.mutate(data);
  };

  const onRentDetails = (data: RentDetailsData) => {
    updateRentInfoMutation.mutate(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  if (user?.isOnboarded) {
    navigate("/");
    return null;
  }

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Get Started with Enoíkio</h1>
            <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className={`text-xs ${step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Welcome to Enoíkio!</CardTitle>
              <CardDescription className="text-lg">
                Build your credit history through your rent payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Track Payments</h3>
                  <p className="text-sm text-gray-600">Automatically track your rent payments and build a payment history</p>
                </div>
                <div className="text-center p-4">
                  <Building className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Get Verified</h3>
                  <p className="text-sm text-gray-600">Get your rental history verified by your landlord</p>
                </div>
                <div className="text-center p-4">
                  <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Build Credit</h3>
                  <p className="text-sm text-gray-600">Share your rent credit report with future landlords</p>
                </div>
              </div>
              <div className="text-center">
                <Button onClick={() => setCurrentStep(2)} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Banknote className="mr-2 h-6 w-6" />
                Connect Your Bank
              </CardTitle>
              <CardDescription>
                Securely connect your bank account to automatically track rent payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={bankForm.handleSubmit(onBankConnect)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Select onValueChange={(value) => bankForm.setValue("bankName", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lloyds">Lloyds Bank</SelectItem>
                        <SelectItem value="barclays">Barclays</SelectItem>
                        <SelectItem value="hsbc">HSBC</SelectItem>
                        <SelectItem value="natwest">NatWest</SelectItem>
                        <SelectItem value="santander">Santander</SelectItem>
                        <SelectItem value="halifax">Halifax</SelectItem>
                        <SelectItem value="nationwide">Nationwide</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select onValueChange={(value) => bankForm.setValue("accountType", value)} defaultValue="current">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current Account</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sortCode">Sort Code</Label>
                    <Input
                      id="sortCode"
                      placeholder="12-34-56"
                      maxLength={8}
                      {...bankForm.register("sortCode")}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) value = value.slice(0, 2) + '-' + value.slice(2);
                        if (value.length >= 5) value = value.slice(0, 5) + '-' + value.slice(5, 7);
                        bankForm.setValue("sortCode", value.replace(/-/g, ''));
                        e.target.value = value;
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="12345678"
                      maxLength={10}
                      {...bankForm.register("accountNumber")}
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" disabled={createBankConnectionMutation.isPending}>
                    {createBankConnectionMutation.isPending ? "Connecting..." : "Connect Bank"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PoundSterling className="mr-2 h-6 w-6" />
                Set Your Rent Details
              </CardTitle>
              <CardDescription>
                Tell us about your rental arrangement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={rentForm.handleSubmit(onRentDetails)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRent">Monthly Rent Amount (£)</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      placeholder="1200"
                      step="0.01"
                      {...rentForm.register("monthlyRent")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDay">Payment Day of Month</Label>
                    <Select onValueChange={(value) => rentForm.setValue("paymentDay", value)} defaultValue="1">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstPaymentDate">First Payment Date</Label>
                  <Input
                    id="firstPaymentDate"
                    type="date"
                    {...rentForm.register("firstPaymentDate")}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="landlordName">Landlord Name (Optional)</Label>
                    <Input
                      id="landlordName"
                      placeholder="John Smith"
                      {...rentForm.register("landlordName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landlordEmail">Landlord Email (Optional)</Label>
                    <Input
                      id="landlordEmail"
                      type="email"
                      placeholder="landlord@example.com"
                      {...rentForm.register("landlordEmail")}
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" disabled={updateRentInfoMutation.isPending}>
                    {updateRentInfoMutation.isPending ? "Saving..." : "Complete Setup"}
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}