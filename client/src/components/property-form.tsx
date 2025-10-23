import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Home, Plus, Save, X, Mail } from "lucide-react";

const propertySchema = z.object({
  address: z.string().min(1, "Property address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  landlordName: z.string().min(1, "Landlord name is required"),
  landlordEmail: z.string().email("Please enter a valid email address"),
  landlordPhone: z.string().optional(),
  monthlyRent: z.string().min(1, "Monthly rent is required").transform((val) => parseFloat(val)),
  leaseStartDate: z.string().min(1, "Lease start date is required"),
  leaseEndDate: z.string().min(1, "Lease end date is required"),
  depositAmount: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  notes: z.string().optional(),
});

type PropertyData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  onPropertyAdded?: () => void;
}

export function PropertyForm({ onPropertyAdded }: PropertyFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data to get saved address
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const form = useForm<PropertyData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      address: "",
      city: "",
      postcode: "",
      landlordName: "",
      landlordEmail: "",
      landlordPhone: "",
      monthlyRent: 0,
      leaseStartDate: "",
      leaseEndDate: "",
      depositAmount: undefined,
      notes: "",
    },
  });

  // Pre-fill address fields when user data is available
  useEffect(() => {
    if (user && (user as any).address) {
      const userAddress = (user as any).address;
      if (userAddress.street) {
        form.setValue('address', userAddress.street);
      }
      if (userAddress.city) {
        form.setValue('city', userAddress.city);
      }
      if (userAddress.postcode) {
        form.setValue('postcode', userAddress.postcode);
      }
    }
  }, [user, form]);

  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyData) => {
      const response = await apiRequest("POST", "/api/properties", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create property");
      }
      return response.json();
    },
    onSuccess: (property) => {
      toast({
        title: "Property added successfully",
        description: "Your property has been added to your portfolio.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      form.reset();
      setIsOpen(false);
      if (onPropertyAdded) {
        onPropertyAdded();
      }
      // Send verification email to landlord
      sendVerificationEmail(property.id, property.landlordEmail, property.landlordName);
    },
    onError: (error: any) => {
      toast({
        title: "Error adding property",
        description: error.message || "Failed to add property. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendVerificationEmailMutation = useMutation({
    mutationFn: async ({ propertyId, email, name }: { propertyId: number; email: string; name: string }) => {
      const response = await apiRequest("POST", "/api/landlord-verification/send", {
        propertyId,
        landlordEmail: email,
        landlordName: name,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send verification email");
      }
      return response.json();
    },
    onSuccess: () => {
      setVerificationSent(true);
      toast({
        title: "Verification email sent",
        description: "Your landlord will receive an email to verify your rental details.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification email failed",
        description: error.message || "Could not send verification email. You can resend it later.",
        variant: "destructive",
      });
    },
  });

  const sendVerificationEmail = (propertyId: number, email: string, name: string) => {
    sendVerificationEmailMutation.mutate({ propertyId, email, name });
  };

  const onSubmit = (data: PropertyData) => {
    createPropertyMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2 border-gray-300">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Add Property</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">Add your rental property to start tracking payments</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Add Rental Property</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="123 Main Street, Apartment 4B"
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="London"
                {...form.register("city")}
              />
              {form.formState.errors.city && (
                <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                placeholder="SW1A 1AA"
                {...form.register("postcode")}
              />
              {form.formState.errors.postcode && (
                <p className="text-sm text-red-500">{form.formState.errors.postcode.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="landlordName">Landlord Name</Label>
              <Input
                id="landlordName"
                placeholder="John Smith"
                {...form.register("landlordName")}
              />
              {form.formState.errors.landlordName && (
                <p className="text-sm text-red-500">{form.formState.errors.landlordName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="landlordEmail">Landlord Email</Label>
              <Input
                id="landlordEmail"
                type="email"
                placeholder="landlord@example.com"
                {...form.register("landlordEmail")}
              />
              {form.formState.errors.landlordEmail && (
                <p className="text-sm text-red-500">{form.formState.errors.landlordEmail.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="landlordPhone">Landlord Phone (Optional)</Label>
              <Input
                id="landlordPhone"
                placeholder="+44 20 1234 5678"
                {...form.register("landlordPhone")}
              />
            </div>

            <div>
              <Label htmlFor="monthlyRent">Monthly Rent (£)</Label>
              <Input
                id="monthlyRent"
                type="number"
                step="0.01"
                placeholder="1200.00"
                {...form.register("monthlyRent")}
              />
              {form.formState.errors.monthlyRent && (
                <p className="text-sm text-red-500">{form.formState.errors.monthlyRent.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="leaseStartDate">Lease Start Date</Label>
              <Input
                id="leaseStartDate"
                type="date"
                {...form.register("leaseStartDate")}
              />
              {form.formState.errors.leaseStartDate && (
                <p className="text-sm text-red-500">{form.formState.errors.leaseStartDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="leaseEndDate">Lease End Date</Label>
              <Input
                id="leaseEndDate"
                type="date"
                {...form.register("leaseEndDate")}
              />
              {form.formState.errors.leaseEndDate && (
                <p className="text-sm text-red-500">{form.formState.errors.leaseEndDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="depositAmount">Deposit Amount (£) (Optional)</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                placeholder="1800.00"
                {...form.register("depositAmount")}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the property or lease..."
                rows={3}
                {...form.register("notes")}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createPropertyMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPropertyMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {createPropertyMutation.isPending ? "Adding Property..." : "Add Property"}
            </Button>
          </div>

          {verificationSent && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-900">
                  Verification email sent to your landlord!
                </p>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your landlord will receive an email with a link to verify your rental details.
              </p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}