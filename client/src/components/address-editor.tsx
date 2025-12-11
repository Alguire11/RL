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
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
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
  };
  onAddressUpdate?: (address: AddressData) => void;
  propertyId?: number;
}

export function AddressEditor({ currentAddress, onAddressUpdate, propertyId }: AddressEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: currentAddress?.street || "",
      city: currentAddress?.city || "",
      postcode: currentAddress?.postcode || "",
      country: currentAddress?.country || "United Kingdom",
    },
  });

  // Update form values when currentAddress changes or dialog opens
  useEffect(() => {
    if (isOpen && currentAddress) {
      form.reset({
        street: currentAddress.street || "",
        city: currentAddress.city || "",
        postcode: currentAddress.postcode || "",
        country: currentAddress.country || "United Kingdom",
      });
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

  // Fetch property details to get verification status
  const { data: properties } = useQuery<any[]>({
    queryKey: ["/api/properties"],
    queryFn: getQueryFn<any[]>({ on401: "throw" }),
    enabled: !!propertyId,
  });

  const currentProperty = properties?.find(p => p.id === propertyId);
  const isVerified = currentProperty?.isVerified || false;

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      if (!propertyId) throw new Error("No property ID");
      return apiRequest("POST", `/api/properties/${propertyId}/resend-verification`, {});
    },
    onSuccess: () => {
      toast({
        title: "Verification email sent",
        description: "We've sent a verification request to your landlord.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const displayAddress = currentAddress?.street
    ? `${currentAddress.street}, ${currentAddress.city}, ${currentAddress.postcode}`
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
                <p className="text-sm text-gray-600">{displayAddress}</p>
              </div>

              {propertyId && (
                <>
                  {/* Verification Status Badge */}
                  <div className="flex items-center space-x-2">
                    {isVerified ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>

                  {/* Resend Verification Button */}
                  {!isVerified && currentProperty?.landlordEmail && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        resendVerificationMutation.mutate();
                      }}
                      disabled={resendVerificationMutation.isPending}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {resendVerificationMutation.isPending ? "Sending..." : "Resend Verification Email"}
                    </Button>
                  )}
                </>
              )}
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
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              placeholder="123 Main Street"
              {...form.register("street")}
            />
            {form.formState.errors.street && (
              <p className="text-sm text-red-500">{form.formState.errors.street.message}</p>
            )}
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              disabled
              {...form.register("country")}
            />
          </div>

          <div className="flex justify-end space-x-2">
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