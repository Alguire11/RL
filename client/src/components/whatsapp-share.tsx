import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Share, Phone } from "lucide-react";

interface WhatsAppShareProps {
  reportUrl: string;
  reportTitle: string;
  children?: React.ReactNode;
}

export function WhatsAppShare({ reportUrl, reportTitle, children }: WhatsAppShareProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generateWhatsAppUrl = (phone: string, msg: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullMessage = `${msg}\n\nView my rent credit report: ${reportUrl}`;
    const encodedMessage = encodeURIComponent(fullMessage);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  };

  const handleWhatsAppShare = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a WhatsApp phone number",
        variant: "destructive",
      });
      return;
    }

    const defaultMessage = message || `Hi! I'd like to share my rent credit report (${reportTitle}) with you. This shows my payment history and creditworthiness as a tenant.`;
    const whatsappUrl = generateWhatsAppUrl(phoneNumber, defaultMessage);
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Opening WhatsApp",
      description: "Your message has been prepared in WhatsApp",
    });
    
    setIsOpen(false);
    setPhoneNumber("");
    setMessage("");
  };

  const handleQuickShare = () => {
    const defaultMessage = `Check out my rent credit report: ${reportTitle}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${defaultMessage}\n\n${reportUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Opening WhatsApp",
      description: "Your report link has been prepared for sharing",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            <span>WhatsApp</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <span>Share via WhatsApp</span>
          </DialogTitle>
          <DialogDescription>
            Share your rent credit report through WhatsApp
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Quick Share Option */}
          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="font-medium text-green-800 mb-2">Quick Share</h3>
            <p className="text-sm text-green-700 mb-3">
              Open WhatsApp with your report link ready to share
            </p>
            <Button 
              onClick={handleQuickShare}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Share className="h-4 w-4 mr-2" />
              Open WhatsApp
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or send to specific contact
              </span>
            </div>
          </div>

          {/* Send to Specific Contact */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="phone" className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>WhatsApp Number</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +44 for UK, +1 for US)
              </p>
            </div>

            <div>
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Hi! I'd like to share my rent credit report with you..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            <Button 
              onClick={handleWhatsAppShare}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!phoneNumber}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send via WhatsApp
            </Button>
          </div>

          {/* Preview */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium text-gray-600">Preview:</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="text-gray-700">
                {message || `Hi! I'd like to share my rent credit report (${reportTitle}) with you. This shows my payment history and creditworthiness as a tenant.`}
              </p>
              <p className="text-blue-600 mt-2 font-medium">
                View my rent credit report: {reportUrl}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}