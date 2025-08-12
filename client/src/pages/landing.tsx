import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { GradientButton } from "@/components/ui/gradient-button";
import { Link, useLocation } from "wouter";
import { CheckCircle, BarChart3, Share2, Menu, X, Star, Shield, Clock, Users, Award, TrendingUp, Check, FileText, CreditCard, Building, MapPin, Calendar } from "lucide-react";

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    window.location.href = "/auth";
  };

  const handleSignIn = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="bg-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#product" className="text-gray-900 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Product</a>
                <a href="#features" className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <a href="#pricing" className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</a>
                <a href="#security" className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Security</a>
                <a href="#support" className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Support</a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <Button variant="outline" onClick={handleSignIn} className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </Button>
                <Button onClick={handleGetStarted} className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Get Started
                </Button>
              </div>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 md:hidden">
          <div className="pt-16 pb-6 px-4">
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-4">
              <a href="#product" className="block text-gray-900 hover:text-primary px-3 py-2 rounded-md text-base font-medium">Product</a>
              <a href="#features" className="block text-gray-500 hover:text-primary px-3 py-2 rounded-md text-base font-medium">Features</a>
              <a href="#pricing" className="block text-gray-500 hover:text-primary px-3 py-2 rounded-md text-base font-medium">Pricing</a>
              <a href="#security" className="block text-gray-500 hover:text-primary px-3 py-2 rounded-md text-base font-medium">Security</a>
              <a href="#support" className="block text-gray-500 hover:text-primary px-3 py-2 rounded-md text-base font-medium">Support</a>
              <hr className="my-4" />
              <Button variant="outline" onClick={handleSignIn} className="block w-full text-left text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 px-3 py-2 rounded-md text-base font-medium">
                Sign In
              </Button>
              <Button onClick={handleGetStarted} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Rent Into{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Credit History
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Enoíkio automatically tracks your on-time rent payments and builds a comprehensive credit portfolio. 
              Turn your rental history into a powerful financial asset.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleGetStarted} className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-blue-600 text-blue-600 hover:bg-blue-50">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Credit Building Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to build credit through your rental payments
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Automatic Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Connect your bank account and we'll automatically track your rent payments, 
                  building your credit history with every on-time payment.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Credit Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Generate professional credit reports showcasing your payment history, 
                  perfect for landlords, lenders, and mortgage applications.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Secure & Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Bank-level security with landlord verification ensures your payment history 
                  is accurate and trusted by financial institutions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for tenants, trusted by landlords and lenders
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="h-8 w-8 text-primary" />,
                title: "Payment Streak Tracking",
                description: "Monitor your consecutive on-time payments to build a strong credit foundation."
              },
              {
                icon: <Clock className="h-8 w-8 text-primary" />,
                title: "On-Time Rate Analytics",
                description: "Track your payment punctuality with detailed analytics and insights."
              },
              {
                icon: <Share2 className="h-8 w-8 text-primary" />,
                title: "Easy Report Sharing",
                description: "Share your credit reports instantly with landlords, lenders, or agencies."
              },
              {
                icon: <Users className="h-8 w-8 text-primary" />,
                title: "Landlord Verification",
                description: "Verified payment history adds credibility to your credit profile."
              },
              {
                icon: <Award className="h-8 w-8 text-primary" />,
                title: "Credit Score Impact",
                description: "See how your rent payments positively impact your overall credit score."
              },
              {
                icon: <Calendar className="h-8 w-8 text-primary" />,
                title: "Payment Reminders",
                description: "Never miss a payment with smart reminders and notifications."
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that works for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">£0</div>
                <p className="text-gray-600">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Basic payment tracking</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Monthly credit reports</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => setLocation('/auth')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">£9.99</div>
                <p className="text-gray-600">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Unlimited reports</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Landlord verification</span>
                  </li>
                </ul>
                <GradientButton 
                  className="w-full mt-6"
                  onClick={() => setLocation('/auth')}
                >
                  Start Free Trial
                </GradientButton>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">£29.99</div>
                <p className="text-gray-600">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Multi-property support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Custom integrations</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => setLocation('/contact')}
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Bank-Level Security
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your financial data is protected with the highest standards
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-primary" />,
                title: "256-bit SSL Encryption",
                description: "All data transmission is encrypted with industry-standard SSL"
              },
              {
                icon: <Building className="h-12 w-12 text-primary" />,
                title: "Bank-Grade Security",
                description: "Same security standards used by major financial institutions"
              },
              {
                icon: <Users className="h-12 w-12 text-primary" />,
                title: "Privacy Protected",
                description: "We never sell or share your personal information"
              },
              {
                icon: <Award className="h-12 w-12 text-primary" />,
                title: "Compliance Ready",
                description: "Fully compliant with UK data protection regulations"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              We're Here to Help
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get the support you need when you need it
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Help Center</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Find answers to common questions and detailed guides
                </p>
                <Button variant="outline">
                  Visit Help Center
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Contact Support</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Get direct help from our support team
                </p>
                <Button variant="outline">
                  Contact Us
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">System Status</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Check the current status of our services
                </p>
                <Button variant="outline">
                  View Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#product" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#security" className="text-gray-400 hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/support" className="text-gray-400 hover:text-white">Support Center</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/status" className="text-gray-400 hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Enoíkio</h3>
              <p className="text-gray-400">
                Building credit through rent payments, one payment at a time.
              </p>
            </div>
          </div>
          <hr className="my-8 border-gray-800" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2024 Enoíkio. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
              <Link href="/admin-login" className="text-gray-400 hover:text-white">Admin Access</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}