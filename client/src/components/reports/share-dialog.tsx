import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Share2, Copy, Mail, Building, CreditCard, Link2 } from "lucide-react";

interface ShareDialogProps {
  report: any;
  onClose: () => void;
}

export function ShareDialog({ report, onClose }: ShareDialogProps) {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientType, setRecipientType] = useState<"landlord" | "lender" | "agency">("landlord");
  const [shareUrl, setShareUrl] = useState("");

  const shareReportMutation = useMutation({
    mutationFn: async (data: { recipientEmail: string; recipientType: string }) => {
      const response = await apiRequest("POST", `/api/reports/${report.id}/share`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
      toast({
        title: "Report Shared",
        description: "Your report has been shared successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to share report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShare = () => {
    if (!recipientEmail) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    shareReportMutation.mutate({ recipientEmail, recipientType });
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Share link has been copied to clipboard",
      });
    }
  };

  const getRecipientTypeIcon = (type: string) => {
    switch (type) {
      case "landlord":
        return <Building className="w-4 h-4" />;
      case "lender":
        return <CreditCard className="w-4 h-4" />;
      case "agency":
        return <Mail className="w-4 h-4" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getRecipientTypeLabel = (type: string) => {
    switch (type) {
      case "landlord":
        return "Landlord";
      case "lender":
        return "Lender/Bank";
      case "agency":
        return "Credit Agency";
      default:
        return "Other";
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Credit Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!shareUrl ? (
            <>
              {/* Recipient Type */}
              <div className="space-y-3">
                <Label>Who are you sharing with?</Label>
                <RadioGroup value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landlord" id="landlord" />
                    <Label htmlFor="landlord" className="flex items-center gap-2 cursor-pointer">
                      <Building className="w-4 h-4" />
                      Landlord/Property Manager
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lender" id="lender" />
                    <Label htmlFor="lender" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="w-4 h-4" />
                      Lender/Bank
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="agency" id="agency" />
                    <Label htmlFor="agency" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="w-4 h-4" />
                      Credit Reporting Agency
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Recipient Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>

              {/* Share Button */}
              <div className="flex gap-3">
                <GradientButton
                  onClick={handleShare}
                  disabled={shareReportMutation.isPending}
                  className="flex-1"
                >
                  {shareReportMutation.isPending ? "Sharing..." : "Share Report"}
                </GradientButton>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <Share2 className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Report Shared Successfully!</h3>
                  <p className="text-sm text-gray-600">
                    Your report has been shared with {recipientEmail}
                  </p>
                </div>
              </div>

              {/* Share URL */}
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  This link will expire in 30 days and can be accessed without login
                </p>
              </div>

              {/* Share Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {getRecipientTypeIcon(recipientType)}
                  <div>
                    <h4 className="font-semibold text-blue-900">
                      Shared with {getRecipientTypeLabel(recipientType)}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {recipientEmail} can now view your rental credit report
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
