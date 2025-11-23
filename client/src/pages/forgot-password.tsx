import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, ArrowLeft, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await apiRequest("POST", "/api/forgot-password", { email });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to send reset link");
            }

            setIsSubmitted(true);
            toast({
                title: "Reset Link Sent",
                description: "If an account exists with this email, you will receive a password reset link.",
            });
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <KeyRound className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email to receive a password reset link
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Forgot Password</CardTitle>
                        <CardDescription>
                            We'll send you instructions to reset your password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSubmitted ? (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <Mail className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                                <p className="text-sm text-gray-600">
                                    We have sent a password reset link to <strong>{email}</strong>.
                                    Please check your inbox and spam folder.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={() => setLocation("/auth")}
                                >
                                    Return to Login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your registered email"
                                        required
                                        disabled={isLoading}
                                    />
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
                                    {isLoading ? "Sending Link..." : "Send Reset Link"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => setLocation("/auth")}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Button>
                </div>
            </div>
        </div>
    );
}
