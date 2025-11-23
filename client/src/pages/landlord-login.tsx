import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building, Eye, EyeOff, ArrowLeft, Home } from "lucide-react";

export default function LandlordLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/landlord/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const user = await response.json();

      toast({
        title: "Login Successful",
        description: `Welcome to the Landlord Dashboard, ${user.firstName || 'Landlord'}!`,
      });

      if (user.role === 'landlord') {
        setLocation('/landlord-dashboard');
      } else if (user.role === 'admin') {
        setLocation('/admin');
      } else {
        setLocation('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-40 right-10 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-75" />
                <div className="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
                  <Building className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Landlord Access
              </h1>
              <p className="text-white/70 text-lg">
                Manage properties, tenants, and verifications
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Home className="h-4 w-4 text-white/70" />
              <span className="text-white/70 text-sm">Property Management Portal</span>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Landlord Sign In</CardTitle>
              <CardDescription>
                Access your property management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="landlord@example.com"
                    className="h-11 transition-all focus:ring-2 focus:ring-purple-500"
                    required
                    data-testid="input-landlord-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className="h-11 pr-10 transition-all focus:ring-2 focus:ring-purple-500"
                      required
                      data-testid="input-landlord-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-sm text-purple-600 hover:text-purple-700"
                      onClick={() => setLocation("/forgot-password")}
                    >
                      Forgot password?
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading}
                  data-testid="button-landlord-login"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setLocation("/landlord-signup")}
                      className="px-0 h-auto text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Sign up here
                    </Button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Alternative Access */}
          <Card className="border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl">
            <CardContent className="pt-6 space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium text-white mb-3">Alternative Access</p>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/admin-login')}
                    className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    Admin Login
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setLocation('/auth')}
                    className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    Tenant Sign Up/Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
