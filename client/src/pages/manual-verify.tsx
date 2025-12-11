import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, ArrowLeft, Loader2, FileText } from "lucide-react";
import type { ApiProperty } from "@/types/api";

export default function ManualVerify() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"new" | "existing">("new"); // New or existing payment
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");
  const [formData, setFormData] = useState({
    propertyId: "",
    rentAmount: "",
    paymentReference: "",
    paymentDate: "",
    landlordEmail: "",
    landlordPhone: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: properties = [] } = useQuery<ApiProperty[]>({
    queryKey: ["/api/properties"],
    retry: false,
  });

  // Fetch unverified manual payments
  const { data: unverifiedPayments = [] } = useQuery<any[]>({
    queryKey: ["/api/manual-payments"],
    retry: false,
    select: (data) => data.filter(p => p.needsVerification),
  });

  // Get selected property
  const selectedProperty = properties.find(p => p.id.toString() === formData.propertyId);
  const rentAmount = selectedProperty?.monthlyRent || selectedProperty?.rentInfo?.amount;

  // Get selected existing payment
  const selectedExistingPayment = unverifiedPayments.find(p => p.id.toString() === selectedPaymentId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image (JPG, PNG) or PDF file.",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation based on mode
    if (mode === "new") {
      if (!formData.propertyId || !formData.rentAmount || !formData.paymentDate || !formData.paymentReference || !formData.landlordEmail || !selectedFile) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields including landlord email, payment reference, and upload a receipt.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Existing payment mode
      if (!selectedPaymentId || !formData.landlordEmail || !selectedFile) {
        toast({
          title: "Missing Information",
          description: "Please select a payment, provide landlord email, and upload a receipt.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Convert file to base64
      const fileReader = new FileReader();
      fileReader.onloadend = async () => {
        const base64File = fileReader.result as string;

        try {
          if (mode === "existing") {
            // Update existing payment with receipt
            const response = await apiRequest("PATCH", `/api/manual-payments/${selectedPaymentId}`, {
              receiptUrl: base64File,
              landlordEmail: formData.landlordEmail,
              landlordPhone: formData.landlordPhone,
              needsVerification: true,
            });

            if (!response.ok) {
              throw new Error("Failed to upload receipt for existing payment");
            }
          } else {
            // Create new manual payment
            const response = await apiRequest("POST", "/api/manual-payments", {
              propertyId: parseInt(formData.propertyId),
              amount: parseFloat(formData.rentAmount),
              paymentDate: formData.paymentDate,
              paymentMethod: "manual_upload",
              description: formData.paymentReference ? `Payment Reference: ${formData.paymentReference}` : "Rent payment",
              receiptUrl: base64File,
              landlordEmail: formData.landlordEmail,
              landlordPhone: formData.landlordPhone,
            });

            if (!response.ok) {
              throw new Error("Failed to submit rent proof");
            }
          }

          queryClient.invalidateQueries({ queryKey: ["/api/manual-payments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/payments"] });

          toast({
            title: "Rent Proof Submitted!",
            description: formData.landlordEmail
              ? "Your rent receipt has been uploaded and a verification request has been sent to your landlord."
              : "Your rent receipt has been uploaded and is being processed.",
          });

          // Reset form
          setFormData({
            propertyId: "",
            rentAmount: "",
            paymentReference: "",
            paymentDate: "",
            landlordEmail: "",
            landlordPhone: "",
          });
          setSelectedFile(null);
          setSelectedPaymentId("");

          // Redirect to credit builder after a short delay
          setTimeout(() => {
            setLocation("/rent-score-builder");
          }, 1500);
        } catch (error) {
          throw error;
        } finally {
          setIsSubmitting(false);
        }
      };
      fileReader.onerror = () => {
        toast({
          title: "Upload Error",
          description: "Failed to read the file. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      };
      fileReader.readAsDataURL(selectedFile);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your rent proof. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Calculate 3 months ago for date restriction
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const minDate = threeMonthsAgo.toISOString().split('T')[0];
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/rent-score-builder')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rent Score Builder
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧾 Upload Rent Proof</h1>
          <p className="text-gray-600">
            Upload your rent receipt or proof of payment to verify your rent history and boost your Rent score.
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Rent Payment Details</CardTitle>
            <CardDescription>
              Provide details about your rent payment and upload proof
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mode Selection */}
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={mode === "new" ? "default" : "outline"}
                    onClick={() => {
                      setMode("new");
                      setSelectedPaymentId("");
                    }}
                    className="w-full"
                  >
                    New Payment
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "existing" ? "default" : "outline"}
                    onClick={() => setMode("existing")}
                    className="w-full"
                    disabled={unverifiedPayments.length === 0}
                  >
                    Existing Payment ({unverifiedPayments.length})
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {mode === "new"
                    ? "Log a new rent payment with receipt"
                    : "Upload receipt for an existing unverified payment"}
                </p>
              </div>

              {/* Existing Payment Selection */}
              {mode === "existing" && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label htmlFor="existingPayment">
                    Select Unverified Payment <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedPaymentId}
                    onValueChange={setSelectedPaymentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a payment to verify" />
                    </SelectTrigger>
                    <SelectContent>
                      {unverifiedPayments.map((payment) => (
                        <SelectItem key={payment.id} value={payment.id.toString()}>
                          £{payment.amount} - {new Date(payment.paymentDate).toLocaleDateString()}
                          {payment.description && ` (${payment.description})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedExistingPayment && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm font-medium">Payment Details:</p>
                      <p className="text-sm text-gray-600">Amount: £{selectedExistingPayment.amount}</p>
                      <p className="text-sm text-gray-600">Date: {new Date(selectedExistingPayment.paymentDate).toLocaleDateString()}</p>
                      {selectedExistingPayment.description && (
                        <p className="text-sm text-gray-600">Note: {selectedExistingPayment.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Landlord Contact Section - Show for BOTH new and existing payments */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-medium">Landlord Contact (For Verification)</h4>

                {/* Landlord Email */}
                <div className="space-y-2">
                  <Label htmlFor="landlordEmail">
                    Landlord Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="landlordEmail"
                    type="email"
                    placeholder="landlord@example.com"
                    value={formData.landlordEmail}
                    onChange={(e) => setFormData({ ...formData, landlordEmail: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    We'll send a verification request to your landlord to confirm this payment
                  </p>
                </div>

                {/* Landlord Phone */}
                <div className="space-y-2">
                  <Label htmlFor="landlordPhone">
                    Landlord Phone <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Input
                    id="landlordPhone"
                    type="tel"
                    placeholder="+44 7XXX XXXXXX"
                    value={formData.landlordPhone}
                    onChange={(e) => setFormData({ ...formData, landlordPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* Only show new payment fields if mode is "new" */}
              {mode === "new" && (
                <>
                  {/* Property Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="property">
                      Property <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.propertyId}
                      onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.address}, {property.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Select the property this payment is for</p>
                  </div>

                  {/* Rent Amount - Editable with Quick Select */}
                  <div className="space-y-2">
                    <Label htmlFor="rentAmount">
                      Rent Amount <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="rentAmount"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      value={formData.rentAmount}
                      onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                      required
                      className="text-lg"
                    />
                    {rentAmount && formData.propertyId && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <p className="text-xs text-gray-600 w-full mb-1">Quick select:</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, rentAmount: rentAmount.toString() })}
                          className="text-xs"
                        >
                          Full: £{rentAmount}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, rentAmount: (Number(rentAmount) * 0.5).toFixed(2) })}
                          className="text-xs"
                        >
                          Half: £{(Number(rentAmount) * 0.5).toFixed(2)}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, rentAmount: (Number(rentAmount) * 0.25).toFixed(2) })}
                          className="text-xs"
                        >
                          Quarter: £{(Number(rentAmount) * 0.25).toFixed(2)}
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Enter any amount or use quick select buttons</p>
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">
                      Payment Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      min={minDate}
                      max={maxDate}
                      required
                    />
                    <p className="text-xs text-gray-500">When was this payment made? (Max 3 months back)</p>
                  </div>

                  {/* Payment Reference - Now Required */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentReference">
                      Payment Reference <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="paymentReference"
                      type="text"
                      placeholder="e.g., RENT-JAN-2025 or Transaction ID"
                      value={formData.paymentReference}
                      onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Enter the reference number from your bank statement or receipt
                    </p>
                  </div>

                  {/* Landlord Contact Section */}
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="text-sm font-medium">Landlord Contact (For Verification)</h4>

                    {/* Landlord Email */}
                    <div className="space-y-2">
                      <Label htmlFor="landlordEmail">
                        Landlord Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="landlordEmail"
                        type="email"
                        placeholder="landlord@example.com"
                        value={formData.landlordEmail}
                        onChange={(e) => setFormData({ ...formData, landlordEmail: e.target.value })}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        We'll send a verification request to your landlord to confirm this payment
                      </p>
                    </div>

                    {/* Landlord Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="landlordPhone">
                        Landlord Phone <span className="text-gray-400 text-xs">(Optional)</span>
                      </Label>
                      <Input
                        id="landlordPhone"
                        type="tel"
                        placeholder="+44 7XXX XXXXXX"
                        value={formData.landlordPhone}
                        onChange={(e) => setFormData({ ...formData, landlordPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Upload Receipt - Available for both modes */}
              <div className="space-y-2">
                <Label htmlFor="receipt">
                  Upload Rent Receipt <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="receipt" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-green-600 mx-auto" />
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedFile(null);
                            const input = document.getElementById('receipt') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <p className="text-sm font-medium text-gray-700">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Rent Proof
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Make sure your receipt clearly shows the payment amount, date, and recipient.
              This helps us verify your payment quickly and accurately.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
