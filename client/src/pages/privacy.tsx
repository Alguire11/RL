import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicNavigation } from "@/components/public-navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { Shield, Eye, Lock, Database, Users, Globe } from "lucide-react";

export default function Privacy() {
  const { isAuthenticated, isLoading } = useAuth();
  const sections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: Database,
      content: [
        "Personal information (name, email, phone number, address)",
        "Financial information (bank account details, transaction history)",
        "Property information (rental addresses, lease details)",
        "Usage data (how you interact with our services)",
        "Device information (browser type, IP address, location data)"
      ]
    },
    {
      id: "information-use",
      title: "How We Use Your Information",
      icon: Eye,
      content: [
        "Provide and maintain our rent tracking services",
        "Process payments and generate credit reports",
        "Communicate with you about your account and services",
        "Improve our platform and develop new features",
        "Comply with legal obligations and prevent fraud"
      ]
    },
    {
      id: "information-sharing",
      title: "Information Sharing",
      icon: Users,
      content: [
        "With your consent, we may share information with landlords for verification",
        "With service providers who assist in our operations",
        "When required by law or to protect our rights",
        "In connection with a merger, acquisition, or asset sale",
        "We never sell your personal information to third parties"
      ]
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: Shield,
      content: [
        "Bank-level encryption for all data transmission",
        "Secure data centers with 24/7 monitoring",
        "Regular security audits and penetration testing",
        "Employee access controls and background checks",
        "Compliance with industry security standards"
      ]
    },
    {
      id: "data-retention",
      title: "Data Retention",
      icon: Lock,
      content: [
        "Account information: Retained while your account is active",
        "Transaction data: Retained for 7 years for credit reporting",
        "Communication records: Retained for 3 years",
        "Marketing preferences: Until you unsubscribe",
        "Legal compliance data: As required by applicable law"
      ]
    },
    {
      id: "your-rights",
      title: "Your Rights",
      icon: Globe,
      content: [
        "Access: Request a copy of your personal information",
        "Correction: Update or correct inaccurate information",
        "Deletion: Request deletion of your personal information",
        "Portability: Request transfer of your data to another service",
        "Objection: Object to processing of your information"
      ]
    }
  ];

  const contactInfo = [
    {
      title: "Data Protection Officer",
      email: "dpo@rentledger.co.uk",
      phone: "+44 20 7123 4567"
    },
    {
      title: "General Privacy Inquiries",
      email: "privacy@rentledger.co.uk",
      phone: "+44 20 7123 4568"
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
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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

        {/* Privacy Policy Sections */}
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

        {/* GDPR Compliance */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>GDPR Compliance</CardTitle>
            <CardDescription>
              Our commitment to European data protection standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Legal Basis for Processing</h3>
                <p className="text-gray-700">
                  We process your personal data based on legitimate interests, contractual necessity, 
                  legal obligations, and your consent where required.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Transfers</h3>
                <p className="text-gray-700">
                  When we transfer data outside the EU, we ensure appropriate safeguards are in place, 
                  including standard contractual clauses and adequacy decisions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Protection Impact Assessments</h3>
                <p className="text-gray-700">
                  We conduct regular assessments to ensure our processing activities meet GDPR requirements 
                  and protect your fundamental rights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>
              Have questions about our privacy practices? Get in touch with our privacy team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {contactInfo.map((contact, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold">{contact.title}</h3>
                  <p className="text-sm text-gray-600">
                    Email: <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                      {contact.phone}
                    </a>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Mailing Address:</strong> Enoíkio Privacy Team, 123 Fintech Street, London EC2A 4NE, United Kingdom
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Policy Updates */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Policy Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. When we do, we will:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">Post the updated policy on our website</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">Update the "last updated" date</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">Notify you of significant changes via email</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}