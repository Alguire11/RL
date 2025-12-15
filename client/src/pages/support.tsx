import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { PublicNavigation } from "@/components/public-navigation";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Activity,
  Book,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { LiveChat, ChatToggle } from "@/components/live-chat";

export default function Support() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const startLiveChat = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
  };

  const supportCategories = [
    {
      title: "Help Center",
      description: "Browse our comprehensive knowledge base and FAQs",
      icon: HelpCircle,
      href: "/help",
      features: [
        "Step-by-step guides",
        "Video tutorials",
        "Frequently asked questions",
        "Getting started guides"
      ]
    },
    {
      title: "Contact Support",
      description: "Get in touch with our support team directly",
      icon: MessageCircle,
      href: "/contact",
      features: [
        "Live chat support",
        "Email support",
        "Phone support",
        "Office locations"
      ]
    },
    {
      title: "System Status",
      description: "Check the status of all RentLedger services",
      icon: Activity,
      href: "/status",
      features: [
        "Real-time service status",
        "Incident reports",
        "Performance metrics",
        "Maintenance updates"
      ]
    }
  ];

  const quickActions = [
    {
      title: "Start Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      action: startLiveChat,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Report an Issue",
      description: "Submit a bug report or technical issue",
      icon: AlertCircle,
      action: () => setLocation('/contact'),
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      title: "Check Service Status",
      description: "View current system status and uptime",
      icon: CheckCircle,
      action: () => setLocation('/status'),
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "Browse Help Articles",
      description: "Find answers in our knowledge base",
      icon: Book,
      action: () => setLocation('/help'),
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    }
  ];

  const popularArticles = [
    "How to connect your bank account",
    "Understanding your credit report",
    "Setting up automatic rent tracking",
    "Sharing reports with landlords",
    "Managing payment notifications",
    "Account security and privacy"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoading && (isAuthenticated ? <Navigation /> : <PublicNavigation />)}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get help with RentLedger. Find answers, contact our team, or check system status.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={action.action}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-full ${action.bgColor} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Support Categories */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {supportCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {category.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={category.href}>
                    <Button className="w-full">
                      Visit {category.title}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Popular Help Articles */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="w-5 h-5 mr-2" />
                Popular Help Articles
              </CardTitle>
              <CardDescription>
                Most frequently accessed help topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popularArticles.map((article, index) => (
                  <Link key={index} href="/help">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">{article}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Multiple ways to reach our support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email Support</p>
                    <p className="text-sm text-gray-600">support@enoikio.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Phone Support</p>
                    <p className="text-sm text-gray-600">+44 7926 528 820</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Live Chat</p>
                    <p className="text-sm text-gray-600">Available 24/7</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Support Hours</p>
                    <p className="text-sm text-gray-600">Mon-Fri 9am-6pm GMT</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/contact">
                  <Button variant="outline" className="w-full">
                    Contact Support Team
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contact */}
        <Card className="mt-8 bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Critical Issue?</h3>
                <p className="text-red-700">
                  For urgent issues affecting your account security or payment processing,
                  contact our emergency support line at <strong>+44 7926 528 820</strong> or
                  use the priority contact form.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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