import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { CheckCircle } from "lucide-react";

export default function ReplitAuth() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  const handleAdminAccess = () => {
    window.location.href = "/admin-login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome to Enoíkio
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Build your credit history through rent payments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In to Your Account</CardTitle>
            <CardDescription>
              Connect with your Replit account to access Enoíkio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Secure authentication with Replit</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No additional passwords needed</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Instant access to your account</span>
                </div>
              </div>

              <Button 
                onClick={handleSignIn}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In with Replit
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <Button 
                onClick={handleAdminAccess}
                variant="outline"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Admin Access
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}