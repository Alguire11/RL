import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Demo credentials - ONLY for landlords and admins
  const adminCredentials = {
    admin: { username: 'admin', password: 'admin123', role: 'admin' },
    landlord: { username: 'landlord', password: 'landlord123', role: 'landlord' }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { username, password } = formData;
    
    // Check credentials
    const matchedCredential = Object.values(adminCredentials).find(
      cred => cred.username === username && cred.password === password
    );

    if (matchedCredential) {
      // Store admin session
      localStorage.setItem('admin_session', JSON.stringify({
        username: matchedCredential.username,
        role: matchedCredential.role,
        loginTime: new Date().toISOString()
      }));

      toast({
        title: "Login Successful",
        description: `Welcome, ${matchedCredential.role}!`,
      });

      // Redirect based on role
      if (matchedCredential.role === 'admin') {
        setLocation('/admin');
      } else if (matchedCredential.role === 'landlord') {
        setLocation('/landlord-dashboard');
      } else {
        setLocation('/dashboard');
      }
    } else {
      setError('Invalid username or password');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Landlord & Admin Access
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Demo access for landlords and administrators only
          </p>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">Demo Credentials:</p>
            <p>• Landlord: <code className="bg-white px-1 rounded">landlord / landlord123</code></p>
            <p>• Admin: <code className="bg-white px-1 rounded">admin / admin123</code></p>
          </div>
          
          <div className="mt-3 p-3 bg-purple-50 rounded-lg text-sm text-purple-800">
            <p className="font-medium">👤 Regular users (tenants):</p>
            <p className="text-xs mt-1">Please use the main sign up/login page instead</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Landlord & Admin Login</CardTitle>
            <CardDescription>
              Enter landlord or admin credentials (demo accounts only)
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Demo Credentials</CardTitle>
            <CardDescription>Landlord & Admin access only</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Admin:</span>
                <span className="text-sm text-gray-600">admin / admin123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Landlord:</span>
                <span className="text-sm text-gray-600">landlord / landlord123</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-purple-900 mb-2">Are you a tenant?</p>
              <p className="text-xs text-purple-700 mb-3">Regular users should create an account on the main sign up page</p>
              <Button
                variant="outline"
                onClick={() => setLocation('/auth')}
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                Go to User Sign Up/Login
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}