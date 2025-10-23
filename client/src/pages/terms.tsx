import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicNavigation } from "@/components/public-navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { FileText, Scale, Shield, CreditCard, Users, AlertTriangle } from "lucide-react";

export default function Terms() {
  const { isAuthenticated, isLoading } = useAuth();
  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: FileText,
      content: [
        "By accessing and using RentLedger, you accept and agree to be bound by these Terms of Service",
        "If you do not agree to these terms, please do not use our services",
        "These terms apply to all users of the platform",
        "We may modify these terms at any time with notice to users"
      ]
    },
    {
      id: "services",
      title: "Description of Services",
      icon: CreditCard,
      content: [
        "RentLedger provides rent payment tracking and credit building services",
        "We help tenants build credit history through documented rent payments",
        "Our services include payment monitoring, credit report generation, and landlord verification",
        "We connect to banks through secure Open Banking protocols",
        "Service availability may vary based on location and bank support"
      ]
    },
    {
      id: "user-obligations",
      title: "User Obligations",
      icon: Users,
      content: [
        "You must provide accurate and complete information when registering",
        "You are responsible for maintaining the confidentiality of your account",
        "You must not use the service for any illegal or unauthorized purposes",
        "You must pay all applicable fees and charges",
        "You must notify us immediately of any unauthorized use of your account"
      ]
    },
    {
      id: "privacy-data",
      title: "Privacy and Data Protection",
      icon: Shield,
      content: [
        "We collect and process personal and financial data as described in our Privacy Policy",
        "Your data is protected using industry-standard security measures",
        "We comply with UK GDPR and other applicable data protection laws",
        "You have rights regarding your personal data including access, correction, and deletion",
        "We may share data with landlords and financial institutions with your consent"
      ]
    },
    {
      id: "fees-payments",
      title: "Fees and Payments",
      icon: CreditCard,
      content: [
        "Basic rent tracking services are provided free of charge",
        "Premium features require a paid subscription",
        "All fees are clearly displayed before purchase",
        "Subscription fees are charged monthly or annually as selected",
        "Refunds are provided in accordance with our refund policy"
      ]
    },
    {
      id: "disclaimers",
      title: "Disclaimers and Limitations",
      icon: AlertTriangle,
      content: [
        "We provide services 'as is' without warranties of any kind",
        "We cannot guarantee credit score improvements or loan approvals",
        "We are not responsible for decisions made by landlords or lenders",
        "Our liability is limited to the amount you have paid for our services",
        "We are not liable for indirect, incidental, or consequential damages"
      ]
    },
    {
      id: "termination",
      title: "Termination",
      icon: Scale,
      content: [
        "You may terminate your account at any time through your account settings",
        "We may terminate accounts for violation of these terms",
        "Upon termination, your access to services will cease",
        "Data retention after termination is governed by our Privacy Policy",
        "Paid subscription terms survive termination until the end of the billing period"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoading && (isAuthenticated ? <Navigation /> : <PublicNavigation />)}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600">
            Please read these terms carefully before using RentLedger services
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: January 17, 2025
          </p>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <section.icon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">{section.title}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <section.icon className="h-6 w-6 text-blue-600" />
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.content.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Questions About These Terms?</CardTitle>
            <CardDescription>
              Contact our legal team if you have any questions about these terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Legal Department</h3>
                <p className="text-sm text-gray-600">
                  Email: <a href="mailto:legal@rentledger.co.uk" className="text-blue-600 hover:underline">
                    legal@rentledger.co.uk
                  </a>
                </p>
                <p className="text-sm text-gray-600">
                  Phone: <a href="tel:+442071234567" className="text-blue-600 hover:underline">
                    +44 20 7123 4567
                  </a>
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">General Support</h3>
                <p className="text-sm text-gray-600">
                  Email: <a href="mailto:support@rentledger.co.uk" className="text-blue-600 hover:underline">
                    support@rentledger.co.uk
                  </a>
                </p>
                <p className="text-sm text-gray-600">
                  Phone: <a href="tel:+442071234568" className="text-blue-600 hover:underline">
                    +44 20 7123 4568
                  </a>
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Mailing Address:</strong> Enoíkio Legal Team, 123 Fintech Street, London EC2A 4NE, United Kingdom
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Jurisdiction</h3>
                <p className="text-gray-700">
                  These terms are governed by the laws of England and Wales. Any disputes will be resolved 
                  in the courts of England and Wales.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Dispute Resolution</h3>
                <p className="text-gray-700">
                  We encourage users to contact us directly to resolve any disputes. If necessary, 
                  disputes may be resolved through binding arbitration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}