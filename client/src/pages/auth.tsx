import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Logo } from "@/components/logo";
import { PasswordStrength } from "@/components/password-strength";
import { Eye, EyeOff, ArrowLeft, Building, Sparkles, Shield, CheckCircle2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.hash === "#register") return "register";
    return "login";
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return await response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await new Promise(resolve => setTimeout(resolve, 100));
      toast({
        title: "Account created!",
        description: "Welcome to RentLedger. Let's get you started.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different details.",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  const watchPassword = registerForm.watch("password");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated mesh background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75 animate-pulse" />
                <div className="relative bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20">
                  <Logo className="text-white w-32 h-12" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Welcome to RentLedger
              </h1>
              <p className="text-white/80 text-lg">
                Build your credit history through rent payments
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span>Free to Start</span>
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-xl border border-white/20 p-1">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="h-11 pr-10 transition-all focus:ring-2 focus:ring-blue-500"
                          {...loginForm.register("password")}
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
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 h-auto text-sm text-blue-600 hover:text-blue-700"
                          onClick={() => navigate("/forgot-password")}
                        >
                          Forgot password?
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">For Landlords</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4 border-purple-200 bg-purple-50/50 text-purple-700 hover:bg-purple-100 hover:border-purple-300"
                      onClick={() => navigate("/landlord-login")}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Landlord Access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                  <CardDescription>
                    Join thousands building credit through rent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName" className="text-sm font-medium">First Name</Label>
                        <Input
                          id="register-firstName"
                          placeholder="John"
                          className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
                          {...registerForm.register("firstName")}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-xs text-red-600">
                            {registerForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-lastName" className="text-sm font-medium">Last Name</Label>
                        <Input
                          id="register-lastName"
                          placeholder="Doe"
                          className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
                          {...registerForm.register("lastName")}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-xs text-red-600">
                            {registerForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="h-11 pr-10 transition-all focus:ring-2 focus:ring-blue-500"
                          {...registerForm.register("password")}
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
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                      <PasswordStrength password={watchPassword} />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating account...
                        </span>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Landlord CTA */}
          <Card className="border-white/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Building className="h-10 w-10 text-white mx-auto" />
                <h3 className="font-semibold text-white text-lg">Are you a landlord?</h3>
                <p className="text-white/80 text-sm">
                  Access landlord verification system and tenant management tools
                </p>
                <Button
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  onClick={() => navigate("/landlord-login")}
                >
                  Landlord Dashboard Access
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-white/60">
              By signing up, you agree to our{" "}
              <a href="/terms" className="text-white/80 hover:text-white underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-white/80 hover:text-white underline">
                Privacy Policy
              </a>
            </p>
          </div>
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