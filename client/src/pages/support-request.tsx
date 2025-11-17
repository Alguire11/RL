import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSubscription } from "@/hooks/useSubscription";

export default function SupportRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { hasFeature } = useSubscription();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal'
  });

  const submitSupportMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/support/request", data);
      if (!response.ok) throw new Error('Failed to submit support request');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Support Request Submitted",
        description: "We've received your request and will get back to you soon!",
      });
      setFormData({ name: '', email: '', subject: '', message: '', priority: 'normal' });
      setTimeout(() => setLocation('/help'), 2000);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSupportMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Contact Support</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Need help? Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit Support Request</CardTitle>
            <CardDescription>
              Fill out the form below and our team will respond within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Smith"
                    required
                    data-testid="input-support-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    required
                    data-testid="input-support-email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="How can we help you?"
                  required
                  data-testid="input-support-subject"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger id="priority" data-testid="select-support-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General inquiry</SelectItem>
                    <SelectItem value="normal">Normal - Standard support</SelectItem>
                    <SelectItem 
                      value="high" 
                      disabled={!hasFeature('prioritySupport')}
                      className={!hasFeature('prioritySupport') ? 'opacity-50' : ''}
                    >
                      High - Important issue {!hasFeature('prioritySupport') && '(Premium only)'}
                    </SelectItem>
                    <SelectItem 
                      value="urgent" 
                      disabled={!hasFeature('prioritySupport')}
                      className={!hasFeature('prioritySupport') ? 'opacity-50' : ''}
                    >
                      Urgent - Critical problem {!hasFeature('prioritySupport') && '(Premium only)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Please describe your issue in detail..."
                  rows={6}
                  required
                  data-testid="textarea-support-message"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/help')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitSupportMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white dark:text-white"
                  data-testid="button-submit-support"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitSupportMutation.isPending ? "Sending..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Or reach us directly at:
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            support@rentledger.co.uk
          </p>
        </div>
      </div>
    </div>
  );
}
