import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Search, MessageCircle, Book, Phone, Mail, ChevronRight, HelpCircle } from "lucide-react";

export default function HelpCenter() {
  const { user, isAuthenticated } = useAuth();

  const faqs = [
    {
      question: "How does rent payment tracking work?",
      answer: "Enoíkio automatically tracks your rent payments through secure bank connections. When you make a payment, it's recorded and added to your credit history."
    },
    {
      question: "Is my financial data secure?",
      answer: "Yes, we use bank-level encryption and security measures. Your data is protected with 256-bit SSL encryption and we never store your banking credentials."
    },
    {
      question: "How long does it take to build credit?",
      answer: "You can start building credit history immediately. Most users see improvements in their credit profile within 3-6 months of consistent payments."
    },
    {
      question: "Can I share my credit report with landlords?",
      answer: "Yes, you can generate shareable credit reports and send them directly to landlords or property managers through our platform."
    },
    {
      question: "What banks are supported?",
      answer: "We support all major UK banks including Lloyds, Barclays, HSBC, Santander, and many others through Open Banking connections."
    },
    {
      question: "How much does it cost?",
      answer: "Basic rent tracking is free. Premium features like detailed credit reports and landlord verification start at £9.99/month."
    }
  ];

  const supportChannels = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      action: "Start Chat",
      available: "24/7"
    },
    {
      title: "Knowledge Base",
      description: "Browse articles and guides",
      icon: Book,
      action: "Browse Articles",
      available: "Always"
    },
    {
      title: "Phone Support",
      description: "Speak with a support representative",
      icon: Phone,
      action: "Call Now",
      available: "Mon-Fri 9am-6pm"
    },
    {
      title: "Email Support",
      description: "Send us a detailed message",
      icon: Mail,
      action: "Send Email",
      available: "24 hour response"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to your questions and get support when you need it
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search for help articles, guides, or FAQs..." 
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* Support Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {supportChannels.map((channel) => (
            <Card key={channel.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <channel.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{channel.title}</CardTitle>
                <CardDescription>{channel.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full mb-2">
                  {channel.action}
                </Button>
                <p className="text-sm text-gray-500">{channel.available}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Topics */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Setting up your account <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Connecting your bank <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Adding property details <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">First payment tracking <ChevronRight className="h-4 w-4 ml-1" /></a></li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Credit Building
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">How credit scoring works <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Generating credit reports <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Sharing with landlords <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Improving your score <ChevronRight className="h-4 w-4 ml-1" /></a></li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Account & Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Managing your subscription <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Updating payment methods <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Account security <ChevronRight className="h-4 w-4 ml-1" /></a></li>
                <li><a href="#" className="text-blue-600 hover:underline flex items-center">Data privacy <ChevronRight className="h-4 w-4 ml-1" /></a></li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you get the most out of Enoíkio
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Contact Support
            </Button>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Schedule a Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}