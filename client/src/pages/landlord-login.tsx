import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Building, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function LandlordLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
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
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
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

      // Redirect based on role
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Landlord Access
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage properties, tenants, and verifications
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Secure Login</CardTitle>
            <CardDescription>
              Enter your landlord credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Enter username"
                  required
                  data-testid="input-landlord-username"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Enter password"
                    required
                    data-testid="input-landlord-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isLoading}
                data-testid="button-landlord-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div>
                <p className="text-sm font-medium text-blue-900 mb-2">Are you an administrator?</p>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/admin-login')}
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Go to Admin Login
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-blue-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-blue-50 px-2 text-blue-600">Or</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-blue-900 mb-2">Are you a tenant?</p>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/auth')}
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Go to Tenant Sign Up/Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-purple-600 hover:text-purple-700"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
