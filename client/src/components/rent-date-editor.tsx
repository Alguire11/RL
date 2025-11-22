import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Edit3, Save, X, Clock } from "lucide-react";
import { format, addMonths, addDays, startOfMonth, endOfMonth } from "date-fns";
import React from "react";

const rentDateSchema = z.object({
  amount: z.string().min(1, "Rent amount is required").transform((val) => parseFloat(val)),
  dayOfMonth: z.string().min(1, "Day of month is required").transform((val) => parseInt(val)),
  frequency: z.enum(["monthly", "weekly", "fortnightly"]).default("monthly"),
  firstPaymentDate: z.string().min(1, "First payment date is required"),
});

type RentDateData = z.infer<typeof rentDateSchema>;

interface RentDateEditorProps {
  currentRentInfo?: {
    amount?: number;
    dayOfMonth?: number;
    frequency?: string;
    firstPaymentDate?: string;
  };
  onRentUpdate?: (rentInfo: RentDateData) => void;
  propertyId?: number;
}

export function RentDateEditor({ currentRentInfo, onRentUpdate, propertyId }: RentDateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextPaymentDate, setNextPaymentDate] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RentDateData>({
    resolver: zodResolver(rentDateSchema),
    defaultValues: {
      amount: currentRentInfo?.amount || 0,
      dayOfMonth: currentRentInfo?.dayOfMonth || 1,
      frequency: (currentRentInfo?.frequency as any) || "monthly",
      firstPaymentDate: currentRentInfo?.firstPaymentDate || format(new Date(), "yyyy-MM-dd"),
    },
  });

  const calculateNextPaymentDate = (amount: number, dayOfMonth: number, frequency: string, firstPaymentDate: string) => {
    const baseDate = new Date(firstPaymentDate);
    const today = new Date();

    let nextDate: Date;

    switch (frequency) {
      case "weekly":
        nextDate = new Date(baseDate);
        while (nextDate <= today) {
          nextDate = addDays(nextDate, 7);
        }
        break;
      case "fortnightly":
        nextDate = new Date(baseDate);
        while (nextDate <= today) {
          nextDate = addDays(nextDate, 14);
        }
        break;
      case "monthly":
      default:
        nextDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
        if (nextDate <= today) {
          nextDate = addMonths(nextDate, 1);
        }
        break;
    }

    return format(nextDate, "PPP");
  };

  const updateRentMutation = useMutation({
    mutationFn: async (data: RentDateData) => {
      const nextPayment = calculateNextPaymentDate(data.amount, data.dayOfMonth, data.frequency, data.firstPaymentDate);

      const rentData = {
        ...data,
        nextPaymentDate: nextPayment,
      };

      if (propertyId) {
        const response = await apiRequest("PUT", `/api/properties/${propertyId}`, {
          rentInfo: rentData,
          monthlyRent: data.amount
        });

        if (!response.ok) {
          const error = await response.json();
          throw error;
        }

        return response.json();
      } else {
        return apiRequest("PUT", "/api/user/rent-info", rentData);
      }
    },
    onSuccess: (data) => {
      const remainingUpdates = data?._meta?.remainingRentUpdates;

      toast({
        title: "Rent details updated",
        description: remainingUpdates !== undefined
          ? `Your rent payment details have been updated. You have ${remainingUpdates} rent update${remainingUpdates !== 1 ? 's' : ''} remaining this month.`
          : "Your rent payment details have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setIsOpen(false);
      if (onRentUpdate) {
        // Pass the updated data back to the parent immediately
        onRentUpdate({
          ...form.getValues(),
          // Ensure we pass the transformed values if needed, but form.getValues() returns the form state
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to update rent details. Please try again.";
      const isLimitReached = error.remainingUpdates === 0;

      toast({
        title: isLimitReached ? "Rent Update Limit Reached" : "Error updating rent details",
        description: isLimitReached
          ? `${errorMessage} The limit will reset next month.`
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RentDateData) => {
    updateRentMutation.mutate(data);
  };

  const watchedValues = form.watch();

  // Calculate next payment date in real-time
  React.useEffect(() => {
    if (watchedValues.amount && watchedValues.dayOfMonth && watchedValues.frequency && watchedValues.firstPaymentDate) {
      const nextDate = calculateNextPaymentDate(
        watchedValues.amount,
        watchedValues.dayOfMonth,
        watchedValues.frequency,
        watchedValues.firstPaymentDate
      );
      setNextPaymentDate(nextDate);
    }
  }, [watchedValues]);

  // Update form values when currentRentInfo changes
  React.useEffect(() => {
    if (currentRentInfo) {
      form.reset({
        amount: currentRentInfo.amount || 0,
        dayOfMonth: currentRentInfo.dayOfMonth || 1,
        frequency: (currentRentInfo.frequency as any) || "monthly",
        firstPaymentDate: currentRentInfo.firstPaymentDate || format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [currentRentInfo, form]);

  const displayRentInfo =
    currentRentInfo?.amount != null && currentRentInfo?.dayOfMonth != null
      ? `£${currentRentInfo.amount}/month - Due ${currentRentInfo.dayOfMonth}${getOrdinalSuffix(currentRentInfo.dayOfMonth)}`
      : "No rent details set";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Rent Details</CardTitle>
            <Edit3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <p className="text-sm text-gray-600">
                {currentRentInfo?.amount != null
                  ? `£${currentRentInfo.amount}/month - Due ${currentRentInfo.dayOfMonth || 1}${getOrdinalSuffix(Number(currentRentInfo.dayOfMonth || 1))}`
                  : "No rent details set"}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Rent Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Rent Amount (£)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="1200.00"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayOfMonth">Day of Month (1-31)</Label>
            <Input
              id="dayOfMonth"
              type="number"
              min="1"
              max="31"
              placeholder="1"
              {...form.register("dayOfMonth")}
            />
            {form.formState.errors.dayOfMonth && (
              <p className="text-sm text-red-500">{form.formState.errors.dayOfMonth.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Payment Frequency</Label>
            <Select
              value={form.watch("frequency")}
              onValueChange={(value) => form.setValue("frequency", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Fortnightly</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.frequency && (
              <p className="text-sm text-red-500">{form.formState.errors.frequency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstPaymentDate">First Payment Date</Label>
            <Input
              id="firstPaymentDate"
              type="date"
              {...form.register("firstPaymentDate")}
            />
            {form.formState.errors.firstPaymentDate && (
              <p className="text-sm text-red-500">{form.formState.errors.firstPaymentDate.message}</p>
            )}
          </div>

          {nextPaymentDate && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  Next Payment Due: {nextPaymentDate}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={updateRentMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateRentMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateRentMutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}