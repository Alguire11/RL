import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/navigation";
import { PublicNavigation } from "@/components/public-navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Search, MessageCircle, Book, Phone, Mail, ChevronRight, HelpCircle, ArrowLeft } from "lucide-react";
import { LiveChat, ChatToggle } from "@/components/live-chat";

export default function HelpCenter() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState<typeof faqs>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const faqs = [
    {
      category: "Getting Started",
      question: "How do I set up my account?",
      answer: "Create your account by providing your email, name, and creating a secure password. You'll receive a verification email to activate your account. Once verified, complete your profile with rental property details and connect your bank account through our secure Open Banking integration."
    },
    {
      category: "Getting Started", 
      question: "How do I connect my bank account?",
      answer: "We use Open Banking technology to securely connect to your bank. Simply select your bank from our supported list, log in through their official website, and authorize RentLedger to view your transaction data. We never store your banking credentials and only access rent-related transactions."
    },
    {
      category: "Getting Started",
      question: "What property details do I need to provide?",
      answer: "You'll need your rental property address, monthly rent amount, landlord contact information, and lease start/end dates. This helps us accurately identify your rent payments and create comprehensive reports for verification purposes."
    },
    {
      category: "Credit Building",
      question: "How does credit scoring work with rent payments?",
      answer: "Credit scores are calculated based on payment history, credit utilization, length of credit history, and types of credit. Rent payments demonstrate consistent payment behavior and financial responsibility. Our system tracks on-time payments, payment amounts, and payment frequency to build your rental credit profile."
    },
    {
      category: "Credit Building",
      question: "How do I generate and share credit reports?",
      answer: "Navigate to the Reports section, select 'Generate Credit Report', and choose your date range. The report includes payment history, on-time percentage, and landlord verification details. You can share reports via email, download as PDF, or create shareable links with expiration dates for security."
    },
    {
      category: "Credit Building",
      question: "How can I improve my credit score?",
      answer: "Make all rent payments on time, maintain consistent payment amounts, keep your account active for longer periods, and consider upgrading to Premium for additional credit-building features like payment reminders and detailed analytics that help track your progress."
    },
    {
      category: "Account & Billing",
      question: "How do I manage my subscription?",
      answer: "Visit Settings > Subscription to view your current plan (Free, Premium £9.99/month, or Pro £19.99/month). You can upgrade for additional features like advanced analytics, multiple properties, and priority support. Downgrade or cancel anytime - changes take effect at your next billing cycle."
    },
    {
      category: "Account & Billing", 
      question: "How do I update my payment method?",
      answer: "Go to Settings > Billing, click 'Update Payment Method', and add your new credit or debit card details. We accept Visa, Mastercard, and American Express. Your new payment method will be used for the next billing cycle. You can also set up automatic billing reminders."
    },
    {
      category: "Account & Billing",
      question: "How is my data protected?",
      answer: "We use 256-bit SSL encryption, comply with GDPR regulations, and store data in secure UK-based servers. We never share your personal information without consent, use multi-factor authentication, and conduct regular security audits. You can download or delete your data anytime from Settings > Privacy."
    },
    {
      category: "Technical", 
      question: "What banks are supported?",
      answer: "We support all major UK banks through Open Banking including Lloyds, Barclays, HSBC, Santander, NatWest, RBS, Monzo, Starling Bank, and over 100+ others. If your bank isn't listed, contact our support team at support@rentledger.co.uk for assistance."
    },
    {
      category: "Technical",
      question: "Why isn't my rent payment being tracked?",
      answer: "Ensure your payment matches the rent amount in your profile settings, is made from the connected bank account, and goes to the same recipient each month. Payments may take 1-2 business days to appear. If issues persist, contact support@rentledger.co.uk with your payment details for manual verification."
    },
    {
      category: "Billing",
      question: "What's included in each subscription tier?",
      answer: "Free: Basic payment tracking and simple reports. Premium (£9.99/month): Payment reminders, detailed analytics, landlord verification, PDF reports. Pro (£19.99/month): Multiple properties, priority support, advanced analytics, WhatsApp sharing, custom report branding, and API access."
    }
  ];

  // Initialize filtered FAQs
  useEffect(() => {
    setFilteredFaqs(faqs);
  }, []);

  // Filter FAQs based on search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredFaqs(faqs);
    } else {
      const filtered = faqs.filter(faq => 
        faq.question.toLowerCase().includes(query.toLowerCase()) ||
        faq.answer.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredFaqs(filtered);
    }
  };

  const startLiveChat = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
  };

  const supportChannels = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      action: "Start Chat",
      available: "24/7",
      onClick: startLiveChat
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
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
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
                <Button 
                  variant="outline" 
                  className="w-full mb-2"
                  onClick={(channel as any).onClick || (() => {
                    if (channel.title === "Phone Support") {
                      window.open("tel:+442071234567");
                    } else if (channel.title === "Email Support") {
                      setLocation('/contact');
                    }
                  })}
                >
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
              <CardDescription>Everything you need to begin your credit journey</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <a href="#setting-up" className="text-blue-600 hover:underline flex items-center group">
                    Setting up your account
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Create your RentLedger account in under 3 minutes with email verification and secure profile setup</p>
                </li>
                <li>
                  <a href="#connecting-bank" className="text-blue-600 hover:underline flex items-center group">
                    Connecting your bank
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Securely link your bank account using Open Banking for automatic rent payment tracking</p>
                </li>
                <li>
                  <a href="#property-details" className="text-blue-600 hover:underline flex items-center group">
                    Adding property details
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Enter your rental property address, landlord details, and monthly rent amount</p>
                </li>
                <li>
                  <a href="#first-payment" className="text-blue-600 hover:underline flex items-center group">
                    First payment tracking
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">How your first rent payment is detected and recorded in your credit history</p>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Credit Building
              </CardTitle>
              <CardDescription>Build and improve your credit score with rent payments</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <a href="#credit-scoring" className="text-blue-600 hover:underline flex items-center group">
                    How credit scoring works
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Understanding credit scores, factors that affect them, and how rent payments help</p>
                </li>
                <li>
                  <a href="#credit-reports" className="text-blue-600 hover:underline flex items-center group">
                    Generating credit reports
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Create professional credit reports showing your rental payment history and reliability</p>
                </li>
                <li>
                  <a href="#sharing-landlords" className="text-blue-600 hover:underline flex items-center group">
                    Sharing with landlords
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Send verified rental history reports to prospective landlords and property managers</p>
                </li>
                <li>
                  <a href="#improving-score" className="text-blue-600 hover:underline flex items-center group">
                    Improving your score
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Tips and strategies to maximize your credit improvement through consistent rent payments</p>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Account & Billing
              </CardTitle>
              <CardDescription>Manage your subscription and account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <a href="#subscription-management" className="text-blue-600 hover:underline flex items-center group">
                    Managing your subscription
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Upgrade, downgrade, or cancel your subscription plan (Free, Premium, Pro)</p>
                </li>
                <li>
                  <a href="#payment-methods" className="text-blue-600 hover:underline flex items-center group">
                    Updating payment methods
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Add, remove, or change your credit card and billing information securely</p>
                </li>
                <li>
                  <a href="#account-security" className="text-blue-600 hover:underline flex items-center group">
                    Account security
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Two-factor authentication, password security, and protecting your personal data</p>
                </li>
                <li>
                  <a href="#data-privacy" className="text-blue-600 hover:underline flex items-center group">
                    Data privacy
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-sm text-gray-500 mt-1">How we protect your financial data and comply with GDPR regulations</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            <CardDescription>Comprehensive answers to help you get the most out of Enoíkio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-3">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-3">{faq.question}</h3>
                      <div className="text-gray-600 leading-relaxed">
                        {faq.answer.includes('support@enoikio.co.uk') ? (
                          <div>
                            {faq.answer.split('support@enoikio.co.uk').map((part, i, arr) => (
                              <span key={i}>
                                {part}
                                {i < arr.length - 1 && (
                                  <a 
                                    href="mailto:support@enoikio.co.uk" 
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    support@enoikio.co.uk
                                  </a>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p>{faq.answer}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredFaqs.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-2">No FAQs found matching "{searchQuery}"</p>
                  <p className="text-sm mb-4">Try different keywords or get personalized help:</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button 
                      onClick={startLiveChat} 
                      className="text-blue-600 hover:underline font-medium px-4 py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Start Live Chat
                    </button>
                    <a 
                      href="mailto:support@enoikio.co.uk" 
                      className="text-blue-600 hover:underline font-medium px-4 py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Email Support
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-2">
            Our support team is here to help you get the most out of Enoíkio
          </p>
          <p className="text-sm text-gray-500 mb-6">
            For complex technical issues, billing inquiries, or account problems, email us at{" "}
            <a href="mailto:support@enoikio.co.uk" className="text-blue-600 hover:underline font-medium">
              support@enoikio.co.uk
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = 'mailto:support@enoikio.co.uk'}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={startLiveChat}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Live Chat
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => setLocation('/contact')}
            >
              Contact Form
            </Button>
          </div>
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