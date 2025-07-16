import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { FileText, Shield, Users, AlertCircle } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600">
              Please read these terms carefully before using our services.
            </p>
            <p className="text-sm text-gray-500 mt-4">Last updated: December 15, 2024</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <FileText className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-2xl">Service Agreement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  By using Enoíkio, you agree to these terms and conditions governing our credit building services.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle className="text-2xl">Your Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  These terms protect both you and Enoíkio, ensuring fair and transparent service delivery.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By creating an account or using any part of the Enoíkio service, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
            <p className="text-gray-600">
              We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the updated terms.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Service Description</h2>
            <p className="text-gray-600 mb-4">
              Enoíkio provides credit building services by tracking your rent payments and generating credit reports. Our services include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Automatic rent payment tracking through secure bank connections</li>
              <li>Credit report generation based on payment history</li>
              <li>Report sharing capabilities with landlords and lenders</li>
              <li>Payment analytics and credit building insights</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. User Responsibilities</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Security</h3>
                <p className="text-gray-600">
                  You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Accurate Information</h3>
                <p className="text-gray-600">
                  You must provide accurate and complete information when creating your account and using our services.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Lawful Use</h3>
                <p className="text-gray-600">
                  You agree to use our services only for lawful purposes and in accordance with these terms.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Payment Terms</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Subscription Plans</h3>
                <p className="text-gray-600">
                  We offer various subscription plans with different features and pricing. All fees are stated in British Pounds (GBP).
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Billing</h3>
                <p className="text-gray-600">
                  Subscription fees are billed monthly or annually in advance. You authorize us to charge your payment method on file.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Refunds</h3>
                <p className="text-gray-600">
                  Refunds are available within 30 days of purchase, subject to our refund policy. Contact support for refund requests.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Data and Privacy</h2>
            <p className="text-gray-600 mb-4">
              Your privacy is important to us. Our collection and use of your personal information is governed by our Privacy Policy, which forms part of these terms.
            </p>
            <p className="text-gray-600">
              By using our services, you consent to the collection and use of your information as described in our Privacy Policy.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">6. Limitations and Disclaimers</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Important Notice</h3>
                  <p className="text-gray-600">
                    While we strive to provide accurate credit reporting, we cannot guarantee specific credit score improvements or loan approvals.
                  </p>
                </div>
              </div>
            </div>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Services are provided "as is" without warranties of any kind</li>
              <li>We are not responsible for decisions made by lenders or credit agencies</li>
              <li>Service availability may be subject to maintenance and updates</li>
              <li>Our liability is limited to the amount you paid for our services</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Termination</h2>
            <p className="text-gray-600 mb-4">
              You may terminate your account at any time through your account settings. We may terminate or suspend your account if you violate these terms.
            </p>
            <p className="text-gray-600">
              Upon termination, your access to the services will cease, but certain provisions of these terms will survive termination.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> legal@enoikio.com</p>
              <p><strong>Address:</strong> Enoíkio Ltd, 123 Fintech Street, London, EC2V 8AB</p>
              <p><strong>Phone:</strong> +44 20 7123 4567</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}