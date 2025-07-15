import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui/gradient-button";
import { Logo } from "@/components/logo";
import { CheckCircle, BarChart3, Share2, Menu, X, Star } from "lucide-react";

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const handleSignIn = () => {
    window.location.href = "/api/login";
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
                <a href="#home" className="text-gray-900 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</a>
                <a href="#features" className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <a href="#about" className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                <a href="#contact" className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Contact</a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <Button variant="ghost" onClick={handleSignIn} className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </Button>
                <GradientButton onClick={handleGetStarted} className="ml-3">
                  Get Started
                </GradientButton>
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
              <a href="#home" className="block text-gray-900 hover:text-primary px-3 py-2 rounded-md text-base font-medium">Home</a>
              <a href="#features" className="block text-gray-500 hover:text-primary px-3 py-2 rounded-md text-base font-medium">Features</a>
              <a href="#about" className="block text-gray-500 hover:text-primary px-3 py-2 rounded-md text-base font-medium">About</a>
              <a href="#contact" className="block text-gray-500 hover:text-primary px-3 py-2 rounded-md text-base font-medium">Contact</a>
              <hr className="my-4" />
              <Button variant="ghost" onClick={handleSignIn} className="block w-full text-left text-gray-500 hover:text-primary px-3 py-2 rounded-md text-base font-medium">
                Sign In
              </Button>
              <GradientButton onClick={handleGetStarted} className="block w-full">
                Get Started
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section id="home" className="relative gradient-primary min-h-screen flex items-center">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-slide-up">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Build Your <br />
                <span className="text-yellow-300">Rental Credit</span> Portfolio
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                Automatically track on-time rent payments and create a comprehensive credit portfolio to share with landlords, lenders, and credit agencies.
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Button 
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto bg-white text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Get Started Free
                </Button>
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-primary transform hover:scale-105 transition-all duration-200"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-light-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Enoíkio?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Transform your rental history into a powerful financial tool</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Automated Tracking</h3>
                  <p className="text-gray-600">Connect your bank account and let us automatically track your rent payments, building a comprehensive payment history.</p>
                </CardContent>
              </Card>
              <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="w-12 h-12 gradient-accent rounded-xl flex items-center justify-center mb-6">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Credit Building</h3>
                  <p className="text-gray-600">Generate professional reports showcasing your rental reliability to improve your credit profile and rental applications.</p>
                </CardContent>
              </Card>
              <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="w-12 h-12 gradient-success rounded-xl flex items-center justify-center mb-6">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Easy Sharing</h3>
                  <p className="text-gray-600">Share your rental portfolio with landlords, lenders, and credit agencies through secure, verified links.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Join thousands of renters building their credit</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"Enoíkio helped me secure my dream apartment with my strong payment history. The landlord was impressed with my credit report!"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                      <p className="font-semibold">Sarah Johnson</p>
                      <p className="text-sm text-gray-500">London</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"Finally, a way to prove my rental reliability! My credit score improved significantly after using Enoíkio for 6 months."</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold">M</span>
                    </div>
                    <div>
                      <p className="font-semibold">Michael Chen</p>
                      <p className="text-sm text-gray-500">Manchester</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"The automated tracking is brilliant! I don't have to worry about keeping records anymore. Everything is done for me."</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                      <p className="font-semibold">Alice Brown</p>
                      <p className="text-sm text-gray-500">Birmingham</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 gradient-primary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Build Your Credit?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of renters who are already building their credit with Enoíkio
            </p>
            <GradientButton 
              onClick={handleGetStarted}
              className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg"
            >
              Get Started Today
            </GradientButton>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo className="text-white mb-4" />
              <p className="text-gray-400">Building credit through rental payments</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Enoíkio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
