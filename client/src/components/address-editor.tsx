import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Edit3, Save, X, CheckCircle, AlertCircle, Mail } from "lucide-react";

const addressSchema = z.object({
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  addressLine3: z.string().optional(),
  addressLine4: z.string().optional(),
  postcode: z.string().min(1, "Postcode is required").regex(/^[A-Z]{1,2}[0-9R][0-9A-Z]? ?[0-9][A-Z]{2}$/i, "Please enter a valid UK postcode"),
  country: z.string().default("United Kingdom"),
});

type AddressData = z.infer<typeof addressSchema>;

interface AddressEditorProps {
  currentAddress?: {
    street?: string;
    city?: string;
    postcode?: string;
    country?: string;
    // New fields
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    addressLine4?: string;
  };
  onAddressUpdate?: (address: AddressData) => void;
  propertyId?: number;
}

export function AddressEditor({ currentAddress, onAddressUpdate, propertyId }: AddressEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper to resolve initial values
  const getInitialValues = () => ({
    addressLine1: currentAddress?.addressLine1 || currentAddress?.street || "",
    addressLine2: currentAddress?.addressLine2 || "",
    addressLine3: currentAddress?.addressLine3 || currentAddress?.city || "",
    addressLine4: currentAddress?.addressLine4 || "",
    postcode: currentAddress?.postcode || "",
    country: currentAddress?.country || "United Kingdom",
  });

  const form = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: getInitialValues(),
  });

  // Update form values when currentAddress changes or dialog opens
  useEffect(() => {
    if (isOpen && currentAddress) {
      form.reset(getInitialValues());
    }
  }, [currentAddress, isOpen, form]);

  const updateAddressMutation = useMutation({
    mutationFn: async (data: AddressData) => {
      if (propertyId) {
        return apiRequest("PUT", `/api/properties/${propertyId}`, {
          address: data
        });
      } else {
        return apiRequest("PUT", "/api/user/address", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Address updated",
        description: "Your address has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      setIsOpen(false);
      if (onAddressUpdate) {
        onAddressUpdate(form.getValues());
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error updating address",
        description: error.message || "Failed to update address. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddressData) => {
    updateAddressMutation.mutate(data);
  };

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      // Mock for now, or use real endpoint if exists
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Verification email sent", description: "Please check your inbox." });
    }
  });

  const isVerified = false; // logic would depend on property/tenant verification status
  const currentProperty = { landlordEmail: null }; // placeholder

  // Display logic
  const displayAddress = currentAddress
    ? [
      currentAddress.addressLine1 || currentAddress.street,
      currentAddress.addressLine2,
      currentAddress.addressLine3 || currentAddress.city,
      currentAddress.addressLine4,
      currentAddress.postcode
    ].filter(Boolean).join(", ")
    : "No address set";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Address</CardTitle>
            <Edit3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <p className="text-sm text-gray-600 truncate">{displayAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Address</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1 (Number & Street) <span className="text-red-500">*</span></Label>
            <Input
              id="addressLine1"
              placeholder="123 Main Street"
              {...form.register("addressLine1")}
            />
            {form.formState.errors.addressLine1 && (
              <p className="text-sm text-red-500">{form.formState.errors.addressLine1.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2 (Locality)</Label>
            <Input
              id="addressLine2"
              placeholder="Apartment, Suite, Unit, etc."
              {...form.register("addressLine2")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine3">Address Line 3 (Town/City)</Label>
            <Input
              id="addressLine3"
              placeholder="London"
              {...form.register("addressLine3")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine4">Address Line 4 (County)</Label>
            <Input
              id="addressLine4"
              placeholder="Greater London"
              {...form.register("addressLine4")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postcode">Postcode <span className="text-red-500">*</span></Label>
            <Input
              id="postcode"
              placeholder="SW1A 1AA"
              {...form.register("postcode")}
              className="uppercase"
            />
            {form.formState.errors.postcode && (
              <p className="text-sm text-red-500">{form.formState.errors.postcode.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={updateAddressMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateAddressMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateAddressMutation.isPending ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}