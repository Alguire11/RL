import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { Link, useLocation } from "wouter";
import {
  CheckCircle, BarChart3, Share2, Menu, X, Star, Shield, Clock,
  Users, Award, TrendingUp, Check, FileText, CreditCard,
  Building, MapPin, Calendar, ArrowRight, ChevronRight
} from "lucide-react";

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setLocation("/auth");
    }, 300);
  };

  const handleSignIn = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setLocation("/auth");
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-50 selection:bg-blue-500/30">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-900/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Logo className="text-white" />
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {["Product", "Features", "Pricing", "Security"].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/5"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-4 flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={handleSignIn}
                  className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 border-0"
                >
                  Get Started
                </Button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)} className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-xl">
          <div className="p-4">
            <div className="flex justify-end mb-8">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)} className="text-white">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-4">
              {["Product", "Features", "Pricing", "Security"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-lg font-medium text-slate-300 hover:text-white px-4 py-3 rounded-lg hover:bg-white/5"
                >
                  {item}
                </a>
              ))}
              <div className="pt-8 space-y-4 px-4">
                <Button
                  variant="outline"
                  onClick={() => { setIsMenuOpen(false); handleSignIn(); }}
                  className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => { setIsMenuOpen(false); handleGetStarted(); }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium">Now available for all UK tenants</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
            Transform Your Rent Into <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Credit History
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            RentLedger automatically tracks your on-time rent payments and builds a comprehensive credit portfolio.
            Turn your biggest monthly expense into your greatest financial asset.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="text-lg px-8 h-14 bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 h-14 border-white/20 text-white hover:bg-white/10 bg-transparent backdrop-blur-sm"
            >
              How it Works
            </Button>
          </div>

          {/* Stats/Social Proof */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12">
            {[
              { label: "Active Users", value: "10k+" },
              { label: "Rent Tracked", value: "£50M+" },
              { label: "Rent Score Avg", value: "+45pts" },
              { label: "Partner Landlords", value: "500+" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Complete Credit Building Solution
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Everything you need to build credit through your rental payments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Building className="h-8 w-8 text-blue-400" />,
                title: "Automatic Tracking(Coming soon)",
                desc: "Connect your bank account and we'll automatically track your rent payments, building your credit history with every on-time payment.",
                gradient: "from-blue-500/20 to-blue-600/5"
              },
              {
                icon: <FileText className="h-8 w-8 text-purple-400" />,
                title: "Rent Reports",
                desc: "Generate professional Rent Reports showcasing your payment history, perfect for landlords, lenders, and mortgage applications.",
                gradient: "from-purple-500/20 to-purple-600/5"
              },
              {
                icon: <Shield className="h-8 w-8 text-pink-400" />,
                title: "Secure & Verified",
                desc: "Bank-level security with landlord verification ensures your payment history is accurate and trusted by financial institutions.",
                gradient: "from-pink-500/20 to-pink-600/5"
              }
            ].map((feature, i) => (
              <Card key={i} className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 group">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-900/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800/50 to-slate-900 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Built for tenants, trusted by landlords and lenders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
                title: "Payment Streak Tracking",
                desc: "Monitor your consecutive on-time payments to build a strong credit foundation."
              },
              {
                icon: <Clock className="h-6 w-6 text-blue-400" />,
                title: "On-Time Rate Analytics",
                desc: "Track your rent payment punctuality with detailed analytics and insights."
              },
              {
                icon: <Share2 className="h-6 w-6 text-purple-400" />,
                title: "Easy Report Sharing",
                desc: "Share your credit reports instantly with landlords, lenders, or agencies."
              },
              {
                icon: <Users className="h-6 w-6 text-pink-400" />,
                title: "Landlord Verification",
                desc: "Verified payment history adds credibility to your credit profile."
              },
              {
                icon: <Award className="h-6 w-6 text-amber-400" />,
                title: "Credit Score Impact",
                desc: "See how your rent payments positively impact your overall credit score."
              },
              {
                icon: <Calendar className="h-6 w-6 text-cyan-400" />,
                title: "Payment Reminders",
                desc: "Never miss a payment with smart reminders and notifications."
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Choose the plan that works for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-white mb-2">Free</CardTitle>
                <div className="text-5xl font-bold text-white mb-2">£0</div>
                <p className="text-slate-400">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {["Basic payment tracking", "Monthly credit reports", "Email support"].map((item) => (
                    <li key={item} className="flex items-center text-slate-300">
                      <Check className="h-5 w-5 text-blue-500 mr-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent h-12"
                  onClick={() => setLocation('/auth')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-blue-500/50 bg-slate-800/50 backdrop-blur-md shadow-2xl shadow-blue-500/10 relative transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-white mb-2">Professional</CardTitle>
                <div className="text-5xl font-bold text-white mb-2">£9.99</div>
                <p className="text-slate-400">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {["Advanced analytics", "Unlimited reports", "Priority support", "Landlord verification"].map((item) => (
                    <li key={item} className="flex items-center text-white">
                      <Check className="h-5 w-5 text-blue-400 mr-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 h-12 shadow-lg"
                  onClick={() => setLocation('/auth')}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-white mb-2">Enterprise</CardTitle>
                <div className="text-5xl font-bold text-white mb-2">£29.99</div>
                <p className="text-slate-400">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {["Multi-property support", "API access", "Dedicated support", "Custom integrations"].map((item) => (
                    <li key={item} className="flex items-center text-slate-300">
                      <Check className="h-5 w-5 text-blue-500 mr-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent h-12"
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
      <section id="security" className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Bank-Level Security
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Your financial data is protected with the highest standards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-blue-400" />,
                title: "256-bit SSL",
                desc: "All data transmission is encrypted with industry-standard SSL"
              },
              {
                icon: <Building className="h-12 w-12 text-purple-400" />,
                title: "Bank-Grade",
                desc: "Same security standards used by major financial institutions"
              },
              {
                icon: <Users className="h-12 w-12 text-pink-400" />,
                title: "Privacy First",
                desc: "We never sell or share your personal information"
              },
              {
                icon: <Award className="h-12 w-12 text-emerald-400" />,
                title: "Compliant",
                desc: "Fully compliant with UK data protection regulations"
              }
            ].map((item, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <Logo className="text-white mb-6" />
              <p className="text-sm leading-relaxed mb-6">
                Building credit through rent payments, one payment at a time. Join thousands of tenants improving their financial future.
              </p>
              <div className="flex space-x-4">
                {/* Social icons placeholders */}
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-4 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Sign In</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-6">Support</h3>
              <ul className="space-y-4 text-sm">
                <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-6">Legal</h3>
              <ul className="space-y-4 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/admin-login" className="hover:text-white transition-colors">Admin Access</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2025 RentLedger. All rights reserved.</p>
            <p>Made with ❤️ in Yorkshire</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}