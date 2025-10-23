import { useEffect, useState } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Shield, TrendingUp, Users, Building, BarChart3, Crown, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

// Load Stripe outside of component
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = ({ selectedPlan }: { selectedPlan: 'standard' | 'premium' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/landlord-dashboard",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to " + (selectedPlan === 'premium' ? 'Premium' : 'Standard') + "!",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{
        layout: 'tabs',
        wallets: {
          applePay: 'auto',
          googlePay: 'auto',
        }
      }} />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg py-6"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? 'Processing...' : `Subscribe to ${selectedPlan === 'premium' ? 'Premium' : 'Standard'}`}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium'>('premium');
  const [clientSecret, setClientSecret] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: '£0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '1 property',
        'Basic tenant management',
        'Email support',
        'Document vault (5 documents)',
        'Limited analytics'
      ],
      color: 'from-gray-500 to-gray-600',
      icon: Building,
      popular: false
    },
    {
      name: 'Standard',
      price: '£9.99',
      period: '/month',
      description: 'Great for growing landlords',
      features: [
        'Up to 3 properties',
        'Advanced tenant management',
        'Priority email support',
        'Unlimited document vault',
        'Full analytics dashboard',
        'Tenant payment verification',
        'Silver landlord badge'
      ],
      color: 'from-blue-500 to-blue-600',
      icon: Users,
      popular: false
    },
    {
      name: 'Premium',
      price: '£19.99',
      period: '/month',
      description: 'For professional landlords',
      features: [
        'Unlimited properties',
        'Full tenant management suite',
        '24/7 priority support',
        'Unlimited document vault',
        'Advanced analytics & insights',
        'Auto payment verification',
        'Gold landlord badge',
        'API access',
        'Custom branding'
      ],
      color: 'from-purple-500 to-pink-600',
      icon: Crown,
      popular: true
    }
  ];

  const handleSelectPlan = async (planName: 'free' | 'standard' | 'premium') => {
    setSelectedPlan(planName);
    
    if (planName === 'free') {
      toast({
        title: "Free Plan Selected",
        description: "You're already on the free plan. Upgrade to unlock more features!",
      });
      return;
    }

    // Create payment intent for paid plans
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        plan: planName,
        amount: planName === 'standard' ? 9.99 : 19.99
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setShowCheckout(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="mb-6"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Payment Setup Required</CardTitle>
                <CardDescription>Stripe is not configured yet. Please contact support.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (showCheckout && clientSecret) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button variant="ghost" onClick={() => setShowCheckout(false)} className="mb-6" data-testid="button-back-to-plans">
            ← Back to Plans
          </Button>
          
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="text-2xl flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
                Complete Your Subscription
              </CardTitle>
              <CardDescription>
                Subscribe to {selectedPlan === 'premium' ? 'Premium' : 'Standard'} - {selectedPlan === 'premium' ? '£19.99' : '£9.99'}/month
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm selectedPlan={selectedPlan as 'standard' | 'premium'} />
              </Elements>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Secure Payment</p>
                    <p className="text-xs text-blue-700">Your payment information is encrypted and secure. Supports Apple Pay, Google Pay, and all major cards.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="mb-6 text-white hover:bg-white/10"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Unlock powerful landlord features and grow your property portfolio with RentLedger
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-purple-500 transform scale-105' : ''
              }`}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 rounded-t-lg font-semibold">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="text-4xl font-bold mb-2">
                  {plan.price}<span className="text-lg font-normal text-gray-600">{plan.period}</span>
                </div>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan.name.toLowerCase() as 'free' | 'standard' | 'premium')}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
                      : plan.name === 'Free'
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } font-semibold py-6`}
                  data-testid={`button-select-${plan.name.toLowerCase()}`}
                >
                  {plan.name === 'Free' ? 'Current Plan' : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Why Upgrade?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Grow Faster</h3>
              <p className="text-sm text-gray-600">Manage more properties and scale your portfolio with ease</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Better Insights</h3>
              <p className="text-sm text-gray-600">Advanced analytics help you make smarter decisions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Build Trust</h3>
              <p className="text-sm text-gray-600">Verified badges boost your credibility with tenants</p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Link href="/landlord-dashboard">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
