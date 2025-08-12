import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Home, 
  CreditCard, 
  FileText, 
  Settings, 
  Bell,
  Building2,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  content: string;
  target?: string;
  icon: any;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface DashboardTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Enoíkio!',
    description: 'Your journey to building credit through rent payments starts here',
    content: 'Enoíkio helps you track rent payments and build a credit history that landlords and lenders can trust. Let\'s take a quick tour of your new dashboard.',
    icon: Home,
    position: 'center'
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    description: 'Your financial health at a glance',
    content: 'This is your main dashboard where you can see your payment history, credit score trends, and upcoming rent payments. Everything you need is organized clearly here.',
    target: '.dashboard-stats',
    icon: TrendingUp,
    position: 'bottom'
  },
  {
    id: 'payment-tracking',
    title: 'Payment Tracking',
    description: 'Monitor your rent payment history',
    content: 'Track all your rent payments in one place. Each on-time payment helps build your credit profile. You can see payment status, due dates, and your payment streak.',
    target: '.payment-history',
    icon: CreditCard,
    position: 'top'
  },
  {
    id: 'credit-reports',
    title: 'Credit Reports',
    description: 'Generate and share your rental credit history',
    content: 'Create professional credit reports to share with landlords, letting agencies, or lenders. Your payment history becomes a powerful tool for securing better rental opportunities.',
    target: '.credit-reports',
    icon: FileText,
    position: 'left'
  },
  {
    id: 'bank-connections',
    title: 'Bank Integration',
    description: 'Securely connect your bank account',
    content: 'Connect your bank account through Open Banking to automatically track rent payments. This ensures accurate reporting and saves you time on manual entry.',
    target: '.bank-connections',
    icon: Building2,
    position: 'right'
  },
  {
    id: 'notifications',
    title: 'Smart Notifications',
    description: 'Never miss a payment again',
    content: 'Set up payment reminders and get notified about important updates. Choose how and when you want to be reminded about upcoming rent payments.',
    target: '.notifications',
    icon: Bell,
    position: 'bottom'
  },
  {
    id: 'security',
    title: 'Bank-Level Security',
    description: 'Your data is protected',
    content: 'We use the same security standards as your bank, including 256-bit encryption and secure API connections. Your financial data is always protected.',
    target: '.security-badge',
    icon: Shield,
    position: 'top'
  },
  {
    id: 'get-started',
    title: 'Ready to Get Started?',
    description: 'Complete your setup in just a few steps',
    content: 'Now that you know your way around, let\'s complete your profile setup. Add your property details and connect your bank to start building your credit history.',
    icon: Zap,
    position: 'center',
    action: {
      label: 'Complete Setup',
      onClick: () => window.location.href = '/onboarding'
    }
  }
];

export function DashboardTour({ isOpen, onClose, onComplete }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentTourStep = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  useEffect(() => {
    if (isOpen) {
      // Add tour overlay class to body
      document.body.classList.add('tour-active');
      
      // Highlight target element if it exists
      if (currentTourStep.target) {
        const element = document.querySelector(currentTourStep.target);
        if (element) {
          element.classList.add('tour-highlight');
        }
      }
    }

    return () => {
      document.body.classList.remove('tour-active');
      // Remove highlight from all elements
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    };
  }, [isOpen, currentStep, currentTourStep.target]);

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleComplete = () => {
    document.body.classList.remove('tour-active');
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    // Mark tour as skipped in localStorage to prevent reshowing
    localStorage.setItem('enoikio_tour_skipped', 'true');
    document.body.classList.remove('tour-active');
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    onClose();
    onComplete(); // Call onComplete to ensure proper cleanup
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Tour Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 tour-overlay" />
      
      {/* Tour Dialog */}
      <Dialog open={isOpen} onOpenChange={handleSkip}>
        <DialogContent className="sm:max-w-lg z-50">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <currentTourStep.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {currentTourStep.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    {currentTourStep.description}
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className={`space-y-4 transition-all duration-200 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
                <span className="text-blue-600 font-medium">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Content */}
            <Card className="border-0 shadow-none bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  {currentTourStep.content}
                </p>
                
                {currentStep === 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Track rent payments</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Build credit history</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Generate reports</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Share with landlords</span>
                    </div>
                  </div>
                )}

                {currentStep === TOUR_STEPS.length - 1 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Quick Setup</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Complete your profile in under 5 minutes and start building your rental credit history today.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex space-x-2">
                {TOUR_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      index === currentStep
                        ? 'bg-blue-600 w-6'
                        : index < currentStep
                        ? 'bg-blue-300'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={isAnimating}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                
                {currentTourStep.action ? (
                  <Button
                    onClick={currentTourStep.action.onClick}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={isAnimating}
                  >
                    {currentTourStep.action.label}
                    <Zap className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    disabled={isAnimating}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Skip Option */}
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                Skip tour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS for tour highlighting */}
      <style>{`
        .tour-active .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .tour-active .tour-highlight::before {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          animation: tour-pulse 2s infinite;
        }
        
        @keyframes tour-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }
        
        .tour-overlay {
          animation: tour-fade-in 0.3s ease-out;
        }
        
        @keyframes tour-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

// Hook to manage tour state
export function useDashboardTour() {
  const [showTour, setShowTour] = useState(false);

  const startTour = () => setShowTour(true);
  const closeTour = () => setShowTour(false);
  
  const completeTour = () => {
    localStorage.setItem('enoikio_tour_completed', 'true');
    setShowTour(false);
  };

  const shouldShowTour = () => {
    return !localStorage.getItem('enoikio_tour_completed') && !localStorage.getItem('enoikio_tour_skipped');
  };

  return {
    showTour,
    startTour,
    closeTour,
    completeTour,
    shouldShowTour
  };
}