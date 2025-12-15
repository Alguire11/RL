import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/navigation";
import { PublicNavigation } from "@/components/public-navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, ArrowLeft, Loader2 } from "lucide-react";
import { LiveChat, ChatToggle } from "@/components/live-chat";
import { apiRequest } from "@/lib/queryClient";

export default function Contact() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
    priority: 'normal'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/support/contact", formData);

      toast({
        title: "Message Sent Successfully!",
        description: "We've received your support request and will respond within 24 hours. Check your email for confirmation.",
      });

      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: '',
        priority: 'normal'
      });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "Failed to Send Message",
        description: "There was an error sending your message. Please try again or use live chat for immediate help.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startLiveChat = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
  };

  const contactMethods = [
    {
      title: "Email Support",
      description: "Send us a detailed message",
      icon: Mail,
      value: "support@rentledger.co.uk",
      action: "Send Email"
    },
    {
      title: "Phone Support",
      description: "Speak with our team",
      icon: Phone,
      value: "+44 7926 528 820",
      action: "Call Now"
    },
    {
      title: "Live Chat",
      description: "Get instant help",
      icon: MessageCircle,
      value: "Available 24/7",
      action: "Start Chat",
      onClick: startLiveChat
    },
    {
      title: "Office Address",
      description: "Visit our London office",
      icon: MapPin,
      value: "123 Fintech Street, London EC2A 4NE",
      action: "Get Directions"
    }
  ];

  const officeHours = [
    { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 4:00 PM" },
    { day: "Sunday", hours: "Closed" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoading && (isAuthenticated ? <Navigation /> : <PublicNavigation />)}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation(isAuthenticated ? "/" : "/")}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {isAuthenticated ? "Dashboard" : "Home"}
        </Button>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about RentLedger? We're here to help. Get in touch with our support team.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing & Payments</SelectItem>
                      <SelectItem value="account">Account Issues</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your inquiry"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please provide details about your inquiry..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>Choose the best way to reach us</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <method.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{method.title}</h3>
                        <p className="text-gray-600 text-sm">{method.description}</p>
                        <p className="text-blue-600 text-sm font-medium">{method.value}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(method as any).onClick || (() => {
                          if (method.title === "Email Support") {
                            window.open("mailto:support@enoikio.com");
                          } else if (method.title === "Phone Support") {
                            window.open("tel:+447926528820");
                          } else if (method.title === "Office Address") {
                            window.open("https://maps.google.com/?q=123+Fintech+Street,+London+EC2A+4NE");
                          }
                        })}
                      >
                        {method.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Office Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Office Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {officeHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">{schedule.day}</span>
                      <span className="font-medium">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Emergency Support:</strong> Available 24/7 for critical issues
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Live Chat</span>
                    <span className="font-medium text-green-600">Instant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Email Support</span>
                    <span className="font-medium text-blue-600">Within 24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Phone Support</span>
                    <span className="font-medium text-purple-600">Immediate</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Looking for quick answers?</h2>
          <p className="text-gray-600 mb-6">
            Check out our FAQ section for immediate answers to common questions.
          </p>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            Visit FAQ
          </Button>
        </div>
      </div>

      {/* Live Chat Components */}
      {!isChatMinimized && (
        <LiveChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onMinimize={() => {
            setIsChatMinimized(true);
            setIsChatOpen(false);
          }}
        />
      )}

      {(isChatMinimized || !isChatOpen) && (
        <ChatToggle
          onClick={() => {
            setIsChatOpen(true);
            setIsChatMinimized(false);
          }}
        />
      )}
    </div>
  );
}