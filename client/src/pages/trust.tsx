import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, CheckCircle, FileCheck, AlertCircle } from "lucide-react";

export default function Trust() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trust & Security</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your data security and privacy are our top priorities. We're committed to transparency and giving you full control.
          </p>
        </div>

        {/* Glass-style Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Security & Data Protection */}
          <Card className="backdrop-blur-md bg-white/80 border border-gray-200/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Security & Data Protection</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">GDPR Compliant</p>
                    <p className="text-sm text-gray-600">
                      We comply with GDPR regulations and handle your personal data with the highest standards of care.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Optional Bank Linking</p>
                    <p className="text-sm text-gray-600">
                      Bank account connection is completely optional. You can manually upload receipts and proof of payment instead.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Encrypted Receipt Upload</p>
                    <p className="text-sm text-gray-600">
                      All uploaded documents are encrypted at rest and in transit using industry-standard encryption protocols.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Secure Storage</p>
                    <p className="text-sm text-gray-600">
                      Your payment data is stored securely with bank-level encryption and access controls.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Control */}
          <Card className="backdrop-blur-md bg-white/80 border border-gray-200/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">User Control</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Full Consent</p>
                    <p className="text-sm text-gray-600">
                      You control what data you share. We only access information you explicitly authorize.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">No Spam Policy</p>
                    <p className="text-sm text-gray-600">
                      We never sell your data or send unsolicited marketing emails. You can opt out of communications at any time.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Data Use Transparency</p>
                    <p className="text-sm text-gray-600">
                      We clearly explain how your data is used. Your payment history is only used to build your credit profile.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileCheck className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Export & Delete</p>
                    <p className="text-sm text-gray-600">
                      You can export your data or delete your account at any time from your settings page.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Status */}
        <Card className="backdrop-blur-md bg-white/80 border border-gray-200/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Compliance Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">ICO Registration</p>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    In Progress
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  We are currently in the process of registering with the Information Commissioner's Office (ICO) to ensure full compliance with UK data protection regulations.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">FCA Authorization</p>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    In Progress
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  We are working towards Financial Conduct Authority (FCA) authorization to provide credit reporting services in the UK.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Trust Information */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Questions about our security practices?
          </p>
          <a 
            href="/contact" 
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Contact our security team
          </a>
        </div>
      </div>
    </div>
  );
}

