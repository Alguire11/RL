import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Shield, Lock, Eye, Users } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600">
              Your privacy is fundamental to our service. Learn how we protect and use your information.
            </p>
            <p className="text-sm text-gray-500 mt-4">Last updated: December 15, 2024</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-2xl">Data Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We use advanced encryption and security measures to protect your personal and financial information.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Lock className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle className="text-2xl">Secure Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Your data is stored in secure, encrypted databases with restricted access and regular security audits.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What Information We Collect</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Name, email address, and contact information</li>
                  <li>Identity verification documents (as required by law)</li>
                  <li>Property and rental agreement details</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Financial Information</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Bank account details for rent payment verification</li>
                  <li>Payment history and transaction records</li>
                  <li>Credit report information (where provided)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Information</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>How you use our platform and services</li>
                  <li>Device information and IP addresses</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Use Your Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Eye className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Service Provision</h3>
                  <p className="text-gray-600">To provide our credit building services and track your rent payments</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Verification</h3>
                  <p className="text-gray-600">To verify your identity and rental payments for credit reporting</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Communication</h3>
                  <p className="text-gray-600">To send you updates, notifications, and customer support</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Lock className="h-6 w-6 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Legal Compliance</h3>
                  <p className="text-gray-600">To comply with legal obligations and prevent fraud</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Rights</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Access & Portability</h3>
                <p className="text-gray-600">
                  You can request access to your personal data and receive it in a portable format.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Correction</h3>
                <p className="text-gray-600">
                  You can request corrections to any inaccurate or incomplete personal information.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Deletion</h3>
                <p className="text-gray-600">
                  You can request deletion of your personal data, subject to legal requirements.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Objection</h3>
                <p className="text-gray-600">
                  You can object to certain types of processing of your personal information.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement robust security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>256-bit SSL encryption for all data transmission</li>
              <li>Regular security audits and penetration testing</li>
              <li>Restricted access controls and employee training</li>
              <li>Secure cloud infrastructure with backup systems</li>
              <li>Compliance with UK data protection regulations</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> privacy@enoikio.com</p>
              <p><strong>Address:</strong> Enoíkio Ltd, 123 Fintech Street, London, EC2V 8AB</p>
              <p><strong>Phone:</strong> +44 20 7123 4567</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}