import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, Upload, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ApiProperty, ManualPayment as ManualPaymentRecord } from "@/types/api";

const manualPaymentSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
});

type ManualPaymentFormData = z.infer<typeof manualPaymentSchema>;

interface ManualPaymentFormProps {
  onSuccess?: () => void;
}

export function ManualPaymentForm({ onSuccess }: ManualPaymentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ManualPaymentFormData>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      propertyId: "",
      amount: "",
      paymentDate: "",
      paymentMethod: "",
      description: "",
      receiptUrl: "",
    },
  });

  const { data: properties = [] } = useQuery<ApiProperty[]>({
    queryKey: ["/api/properties"],
    retry: false,
  });

  const handleFileUpload = async (file: File): Promise<string> => {
    // For now, create a data URL. In production, this should upload to cloud storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const manualPaymentMutation = useMutation({
    mutationFn: async (data: ManualPaymentFormData) => {
      let receiptUrl = data.receiptUrl;
      
      // Upload file if exists
      if (uploadedFile) {
        setIsUploading(true);
        try {
          receiptUrl = await handleFileUpload(uploadedFile);
        } catch (error) {
          throw new Error("Failed to upload receipt");
        } finally {
          setIsUploading(false);
        }
      }

      const response = await apiRequest("POST", "/api/manual-payments", {
        ...data,
        amount: parseFloat(data.amount),
        paymentDate: new Date(data.paymentDate).toISOString(),
        receiptUrl,
      });
      if (!response.ok) throw new Error("Failed to log payment");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manual-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      toast({
        title: "Payment Logged Successfully!",
        description: `Payment of £${form.getValues("amount")} has been recorded.`,
      });

      // Show badge notification if new badges were earned
      if (Array.isArray(data.newBadges) && data.newBadges.length > 0) {
        setTimeout(() => {
          toast({
            title: "🏆 New Badge Earned!",
            description: `You've earned: ${data.newBadges.map((badge: { title: string }) => badge.title).join(', ')}`,
            duration: 5000,
          });
        }, 1000);
      }

      form.reset();
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ManualPaymentFormData) => {
    manualPaymentMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Log Manual Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Manual Payment</DialogTitle>
          <DialogDescription>
            Record a rent payment made outside of bank linking. This helps build your credit history.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.address}, {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (£)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="text-right"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the rent amount in GBP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormDescription>
                    When was this payment made?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="standing_order">Standing Order</SelectItem>
                      <SelectItem value="direct_debit">Direct Debit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How did you make this payment?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Monthly rent for January, includes utilities, etc."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Receipt/Proof (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {uploadedFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Upload className="h-4 w-4" />
                      <span>{uploadedFile.name}</span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Upload a receipt, screenshot, or proof of payment (images or PDF)
              </FormDescription>
            </FormItem>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={manualPaymentMutation.isPending}
                className="flex-1"
              >
                {manualPaymentMutation.isPending ? "Logging..." : "Log Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ManualPaymentList() {
  const { data: manualPayments = [], isLoading } = useQuery<ManualPaymentRecord[]>({
    queryKey: ["/api/manual-payments"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manual Payments</CardTitle>
          <CardDescription>Loading your manual payment history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (manualPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manual Payments</CardTitle>
          <CardDescription>No manual payments recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Log payments made outside of bank linking to build your credit history.
          </p>
          <ManualPaymentForm />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manual Payments</CardTitle>
          <CardDescription>
            {manualPayments.length} manual payment{manualPayments.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </div>
        <ManualPaymentForm />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {manualPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
                <div className="flex items-center space-x-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">£{Number(payment.amount).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                  {payment.description && (
                    <p className="text-xs text-muted-foreground">{payment.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {payment.needsVerification ? (
                  <Badge variant="secondary">Pending Verification</Badge>
                ) : (
                  <Badge variant="default">Verified</Badge>
                )}
                {payment.receiptUrl && (
                  <Upload className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}