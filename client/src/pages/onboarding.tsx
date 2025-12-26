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
import { Checkbox } from "@/components/ui/checkbox";
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
import { OpenBankingSimulator } from "@/components/open-banking-simulator";
import { Footer } from "@/components/footer";
import { SubscriptionGuard } from "@/components/subscription-guard";

const rentDetailsSchema = z.object({
  monthlyRent: z.string().min(1, "Monthly rent is required"),
  paymentDay: z.string().min(1, "Payment day is required"),
  address: z.string().min(1, "Property address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  landlordName: z.string().min(1, "Landlord/Agent name is required"),
  landlordEmail: z.string().email("Valid landlord/agent email is required"),
  landlordPhone: z.string().min(10, "Landlord/Agent phone number is required"),
  firstPaymentDate: z.string().min(1, "First payment date is required"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
  experianConsent: z.boolean().default(false).refine(val => val === true, "You must consent to credit reporting"),
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
  { id: 1, title: "Welcome", description: "Get started with RentLedger" },
  { id: 2, title: "Your Goal", description: "Why are you joining?" },
  { id: 3, title: "Bank Connection", description: "Connect your bank securely" },
  { id: 4, title: "Rent Details", description: "Set up your rent information" },
  { id: 5, title: "Complete", description: "Start tracking your payments" },
];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const rentForm = useForm<RentDetailsData>({
    resolver: zodResolver(rentDetailsSchema),
    defaultValues: {
      monthlyRent: "",
      paymentDay: "1",
      address: "",
      city: "",
      postcode: "",
      landlordName: "",
      landlordEmail: "",
      landlordPhone: "",
      firstPaymentDate: "",
      dateOfBirth: "",
      experianConsent: false,
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
      setCurrentStep(4);
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
      // First, create or update property with address
      const propertyData = {
        address: data.address.trim(),
        city: data.city.trim(),
        postcode: data.postcode.trim(),
        monthlyRent: parseFloat(data.monthlyRent),
        landlordName: data.landlordName.trim(),
        landlordEmail: data.landlordEmail.trim(),
        landlordPhone: data.landlordPhone.trim(),
        tenancyStartDate: data.firstPaymentDate, // Use first payment date as tenancy start
      };

      // Create property
      let property;
      try {
        console.log("Sending property data:", propertyData);
        const propertyResponse = await apiRequest("POST", "/api/properties", propertyData);
        if (!propertyResponse.ok) {
          const error = await propertyResponse.json();
          console.error("Property creation error response:", error);
          const errorMsg = error.message || error.error || error.details || "Failed to create property";
          throw new Error(errorMsg);
        }
        property = await propertyResponse.json();
        console.log("Property created successfully:", property);
      } catch (error: any) {
        console.error("Property creation failed:", error);
        const errorMsg = error.message || "Failed to create property. Please check all required fields are filled.";
        throw new Error(errorMsg);
      }

      // Save rent info to user profile
      const rentData = {
        amount: parseFloat(data.monthlyRent),
        dayOfMonth: parseInt(data.paymentDay),
        frequency: "monthly",
        firstPaymentDate: data.firstPaymentDate,
        nextPaymentDate: calculateNextPayment(data.paymentDay),
        landlordName: data.landlordName,
        landlordEmail: data.landlordEmail,
        landlordPhone: data.landlordPhone,
      };

      const response = await apiRequest("PUT", "/api/user/rent-info", rentData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save rent details");
      }
      const rentInfoResult = await response.json();

      // Update user address and profile details (DOB, Consent)
      try {
        const profileUpdates = {
          address: {
            street: data.address.trim(),
            city: data.city.trim(),
            postcode: data.postcode.trim(),
          },
          dateOfBirth: data.dateOfBirth,
          experianConsent: data.experianConsent
        };
        await apiRequest("PATCH", "/api/user/profile", profileUpdates);
        // Invalidate user query to refresh address
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } catch (error) {
        console.error("Failed to update user profile/address:", error);
        // Don't fail onboarding if address update fails
      }

      // Invalidate properties query to ensure it's refreshed
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      // Send landlord verification email
      if (property && data.landlordEmail) {
        try {
          await apiRequest("POST", "/api/landlord/verify-request", {
            propertyId: property.id,
            landlordEmail: data.landlordEmail,
          });
        } catch (error) {
          console.error("Failed to send landlord verification email:", error);
          // Don't fail the whole onboarding if email fails
        }
      }

      return { property, rentInfo: rentInfoResult };
    },
    onSuccess: () => {
      updateProfileMutation.mutate({
        isOnboarded: true,
        onboardingReason: selectedGoal
      });
      toast({
        title: "Onboarding Complete!",
        description: "Welcome to RentLedger. A verification email has been sent to your landlord.",
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
            <h1 className="text-2xl font-bold text-gray-900">Get Started with RentLedger</h1>
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
              <CardTitle className="text-3xl">
                {user?.role === "landlord" ? "Welcome Landlords!" : "Welcome to RentLedger!"}
              </CardTitle>
              <CardDescription className="text-lg">
                {user?.role === "landlord"
                  ? "Manage your properties and verify tenant rent payments"
                  : "Build your credit history through your rent payments"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.role === "landlord" ? (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <Building className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Manage Properties</h3>
                    <p className="text-sm text-gray-600">Add and manage all your rental properties in one place</p>
                  </div>
                  <div className="text-center p-4">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Verify Tenants</h3>
                    <p className="text-sm text-gray-600">Verify tenant rent payments and provide rental references</p>
                  </div>
                  <div className="text-center p-4">
                    <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Track Payments</h3>
                    <p className="text-sm text-gray-600">Monitor all rent payments across your properties</p>
                  </div>
                </div>
              ) : (
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
              )}
              <div className="text-center">
                <Button
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentStep(2); }}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg px-10 py-6"
                  data-testid="button-get-started"
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Why are you creating a rent ledger today?</CardTitle>
              <CardDescription>This helps us personalize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {[
                  "I want to build my credit history",
                  "I need verified proof of rent payments",
                  "I want to track my rent payments",
                  "My landlord asked me to join",
                  "Other"
                ].map((goal) => (
                  <div
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedGoal === goal
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{goal}</span>
                      {selectedGoal === goal && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedGoal) {
                      toast({
                        title: "Please select a goal",
                        description: "Tell us a bit about why you're joining",
                        variant: "destructive"
                      });
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto">
            <SubscriptionGuard feature="openBankingIntegration">
              <OpenBankingSimulator
                mode="onboarding"
                onConnectionSuccess={() => {
                  toast({
                    title: "Bank Connected Successfully",
                    description: "Your bank account has been connected. Let's set up your rent details.",
                  });
                  setCurrentStep(4);
                }}
              />
            </SubscriptionGuard>
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6"
                data-testid="button-back-to-goal"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
                data-testid="button-skip-bank"
              >
                Skip for now
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
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
                <div className="space-y-4">

                  <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...rentForm.register("dateOfBirth")}
                      />
                      {rentForm.formState.errors.dateOfBirth && (
                        <p className="text-sm text-red-600">{rentForm.formState.errors.dateOfBirth.message}</p>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">Property Address</h3>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street"
                      {...rentForm.register("address")}
                      className="border-2"
                    />
                    {rentForm.formState.errors.address && (
                      <p className="text-sm text-red-600">{rentForm.formState.errors.address.message}</p>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                      <Input
                        id="city"
                        placeholder="London"
                        {...rentForm.register("city")}
                        className="border-2"
                      />
                      {rentForm.formState.errors.city && (
                        <p className="text-sm text-red-600">{rentForm.formState.errors.city.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode <span className="text-red-500">*</span></Label>
                      <Input
                        id="postcode"
                        placeholder="SW1A 1AA"
                        {...rentForm.register("postcode")}
                        className="border-2"
                      />
                      {rentForm.formState.errors.postcode && (
                        <p className="text-sm text-red-600">{rentForm.formState.errors.postcode.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Rent Details</h3>
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
                      className="h-12 text-base"
                      {...rentForm.register("firstPaymentDate")}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="landlordName" className="text-sm font-semibold">
                      Landlord/Agent Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="landlordName"
                      placeholder="John Smith"
                      {...rentForm.register("landlordName")}
                      className="border-2"
                    />
                    {rentForm.formState.errors.landlordName && (
                      <p className="text-sm text-red-600">{rentForm.formState.errors.landlordName.message}</p>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landlordEmail" className="text-sm font-semibold">
                        Landlord/Agent Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="landlordEmail"
                        type="email"
                        placeholder="landlord@example.com"
                        {...rentForm.register("landlordEmail")}
                        className="border-2"
                      />
                      {rentForm.formState.errors.landlordEmail && (
                        <p className="text-sm text-red-600">{rentForm.formState.errors.landlordEmail.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landlordPhone" className="text-sm font-semibold">
                        Landlord/Agent Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="landlordPhone"
                        type="tel"
                        placeholder="+44 20 1234 5678"
                        {...rentForm.register("landlordPhone")}
                        className="border-2"
                      />
                      {rentForm.formState.errors.landlordPhone && (
                        <p className="text-sm text-red-600">{rentForm.formState.errors.landlordPhone.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Why we need this:</strong> We'll send a verification email to your landlord/agent to confirm your rent payment history.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="experianConsent"
                        checked={rentForm.watch("experianConsent")}
                        onCheckedChange={(checked) => rentForm.setValue("experianConsent", checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="experianConsent"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I consent to sharing my rental payment data with Experian.
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          This allows us to help build your credit history. You can opt-out at any time in settings.
                        </p>
                        {rentForm.formState.errors.experianConsent && (
                          <p className="text-sm text-red-600">{rentForm.formState.errors.experianConsent.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6"
                    data-testid="button-back-to-bank"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateRentInfoMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8"
                    data-testid="button-complete-setup"
                  >
                    {updateRentInfoMutation.isPending ? "Saving..." : "Complete Setup"}
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}