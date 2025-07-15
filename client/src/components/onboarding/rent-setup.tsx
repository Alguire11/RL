import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Calendar, Home, PoundSterling, User, Plus, X } from "lucide-react";

interface RentSetupProps {
  onComplete: () => void;
}

interface RentPayment {
  amount: string;
  dueDate: string;
  paidDate: string;
  status: "paid" | "pending" | "late";
}

export function RentSetup({ onComplete }: RentSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [propertyData, setPropertyData] = useState({
    address: "",
    city: "",
    postcode: "",
    monthlyRent: "",
    landlordName: "",
    landlordEmail: "",
    landlordPhone: "",
    tenancyStartDate: "",
    tenancyEndDate: "",
  });

  const [pastPayments, setPastPayments] = useState<RentPayment[]>([
    { amount: "", dueDate: "", paidDate: "", status: "paid" },
    { amount: "", dueDate: "", paidDate: "", status: "paid" },
    { amount: "", dueDate: "", paidDate: "", status: "paid" },
  ]);

  const createPropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/properties", data);
      return response.json();
    },
    onSuccess: (property) => {
      toast({
        title: "Property Added",
        description: "Your property has been added successfully",
      });
      
      // Create past payments if any are filled
      const validPayments = pastPayments.filter(p => p.amount && p.dueDate && p.paidDate);
      if (validPayments.length > 0) {
        createPayments(property.id, validPayments);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        onComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add property. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createPaymentsMutation = useMutation({
    mutationFn: async ({ propertyId, payments }: { propertyId: number; payments: RentPayment[] }) => {
      const promises = payments.map(payment => 
        apiRequest("POST", "/api/payments", {
          propertyId,
          amount: payment.amount,
          dueDate: payment.dueDate,
          paidDate: payment.paidDate,
          status: payment.status,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Payment History Added",
        description: "Your past payments have been recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add payment history. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createPayments = (propertyId: number, payments: RentPayment[]) => {
    createPaymentsMutation.mutate({ propertyId, payments });
  };

  const handlePropertySubmit = () => {
    if (!propertyData.address || !propertyData.city || !propertyData.postcode || !propertyData.monthlyRent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required property fields",
        variant: "destructive",
      });
      return;
    }

    createPropertyMutation.mutate({
      ...propertyData,
      monthlyRent: parseFloat(propertyData.monthlyRent),
    });
  };

  const handlePaymentChange = (index: number, field: keyof RentPayment, value: string) => {
    const updated = [...pastPayments];
    updated[index] = { ...updated[index], [field]: value };
    setPastPayments(updated);
  };

  const addPayment = () => {
    if (pastPayments.length < 12) {
      setPastPayments([...pastPayments, { amount: "", dueDate: "", paidDate: "", status: "paid" }]);
    }
  };

  const removePayment = (index: number) => {
    if (pastPayments.length > 1) {
      setPastPayments(pastPayments.filter((_, i) => i !== index));
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Add Your Property</CardTitle>
            <p className="text-gray-600">
              Tell us about your current rental property to start tracking payments
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="address">Property Address *</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 King's Road"
                  value={propertyData.address}
                  onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g., London"
                    value={propertyData.city}
                    onChange={(e) => setPropertyData({ ...propertyData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    placeholder="e.g., SW3 4NB"
                    value={propertyData.postcode}
                    onChange={(e) => setPropertyData({ ...propertyData, postcode: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="monthlyRent">Monthly Rent (£) *</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  placeholder="e.g., 1500"
                  value={propertyData.monthlyRent}
                  onChange={(e) => setPropertyData({ ...propertyData, monthlyRent: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenancyStart">Tenancy Start Date</Label>
                  <Input
                    id="tenancyStart"
                    type="date"
                    value={propertyData.tenancyStartDate}
                    onChange={(e) => setPropertyData({ ...propertyData, tenancyStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tenancyEnd">Tenancy End Date</Label>
                  <Input
                    id="tenancyEnd"
                    type="date"
                    value={propertyData.tenancyEndDate}
                    onChange={(e) => setPropertyData({ ...propertyData, tenancyEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Landlord Information (Optional)</h4>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="landlordName">Landlord Name</Label>
                  <Input
                    id="landlordName"
                    placeholder="e.g., John Smith"
                    value={propertyData.landlordName}
                    onChange={(e) => setPropertyData({ ...propertyData, landlordName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="landlordEmail">Email</Label>
                    <Input
                      id="landlordEmail"
                      type="email"
                      placeholder="landlord@example.com"
                      value={propertyData.landlordEmail}
                      onChange={(e) => setPropertyData({ ...propertyData, landlordEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="landlordPhone">Phone</Label>
                    <Input
                      id="landlordPhone"
                      type="tel"
                      placeholder="+44 7123 456789"
                      value={propertyData.landlordPhone}
                      onChange={(e) => setPropertyData({ ...propertyData, landlordPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <GradientButton
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Continue to Payment History
              </GradientButton>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-secondary" />
          </div>
          <CardTitle className="text-2xl font-bold">Add Payment History</CardTitle>
          <p className="text-gray-600">
            Add your past rent payments to build your credit history faster (optional)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {pastPayments.map((payment, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Payment #{index + 1}</h4>
                  {pastPayments.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePayment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`amount-${index}`}>Amount (£)</Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      placeholder="1500"
                      value={payment.amount}
                      onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`dueDate-${index}`}>Due Date</Label>
                    <Input
                      id={`dueDate-${index}`}
                      type="date"
                      value={payment.dueDate}
                      onChange={(e) => handlePaymentChange(index, 'dueDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`paidDate-${index}`}>Paid Date</Label>
                    <Input
                      id={`paidDate-${index}`}
                      type="date"
                      value={payment.paidDate}
                      onChange={(e) => handlePaymentChange(index, 'paidDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pastPayments.length < 12 && (
            <Button
              variant="outline"
              onClick={addPayment}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Payment
            </Button>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Adding 3-6 months of payment history helps build a stronger credit profile from day one.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <GradientButton
              onClick={handlePropertySubmit}
              disabled={createPropertyMutation.isPending || createPaymentsMutation.isPending}
              className="flex-1"
            >
              {createPropertyMutation.isPending || createPaymentsMutation.isPending
                ? "Setting up..."
                : "Complete Setup"
              }
            </GradientButton>
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
