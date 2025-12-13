import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, Mail, RefreshCw } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
    const [, params] = useRoute("/verify-email/:token");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [showResendForm, setShowResendForm] = useState(false);

    const resendMutation = useMutation({
        mutationFn: async (emailAddress: string) => {
            await apiRequest("POST", "/api/resend-verification", { email: emailAddress });
        },
        onSuccess: () => {
            toast({
                title: "Email Sent",
                description: "A new verification link has been sent to your email.",
            });
            setShowResendForm(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to send email",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    useEffect(() => {
        const verifyEmail = async () => {
            if (!params?.token) {
                setStatus("error");
                setMessage("Invalid verification link");
                return;
            }

            try {
                const response = await fetch(`/api/verify-email/${params.token}`, {
                    credentials: "include",
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus("success");
                    setMessage(data.message || "Email verified successfully!");

                    // Force refresh of user data to ensure emailVerified is true in frontend cache
                    // This prevents redirect loops or stale UI
                    await queryClient.invalidateQueries({ queryKey: ["/api/user"] });

                    // Redirect based on role and auth status
                    setTimeout(() => {
                        // Check if we have a user session by attempting to fetch the user
                        // If not logged in, go to login. If logged in, go to dashboard.
                        queryClient.fetchQuery({ queryKey: ["/api/user"] }).then((user: any) => {
                            if (!user) {
                                setLocation("/auth");
                                return;
                            }

                            if (user.role === 'landlord') {
                                setLocation("/landlord-dashboard");
                            } else if (user.role === 'admin') {
                                setLocation("/admin");
                            } else {
                                setLocation("/dashboard");
                            }
                        }).catch(() => {
                            // If fetch fails (401), redirect to login
                            setLocation("/auth");
                        });
                    }, 2000);
                } else {
                    setStatus("error");
                    setMessage(data.message || "Verification failed");
                }
            } catch (error) {
                setStatus("error");
                setMessage("Failed to verify email. Please try again.");
            }
        };

        verifyEmail();
    }, [params?.token, setLocation]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated mesh background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl animate-fade-in">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        {status === "loading" && (
                            <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                        )}
                        {status === "success" && (
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        )}
                        {status === "error" && (
                            <XCircle className="h-16 w-16 text-red-500" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        {status === "loading" && "Verifying Your Email"}
                        {status === "success" && "Email Verified!"}
                        {status === "error" && "Verification Failed"}
                    </CardTitle>
                    <CardDescription className="text-gray-600">{message}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">{status === "success" && (
                    <p className="text-sm text-muted-foreground">
                        Redirecting you to your dashboard...
                    </p>
                )}
                    {status === "error" && (
                        <div className="space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800 font-medium mb-2">
                                    Common reasons for verification failure:
                                </p>
                                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                    <li>The verification link has expired (links are valid for 48 hours)</li>
                                    <li>The link has already been used</li>
                                    <li>The link is invalid or corrupted</li>
                                </ul>
                            </div>

                            {!showResendForm ? (
                                <div className="space-y-3">
                                    <Button
                                        onClick={() => setShowResendForm(true)}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Request New Verification Link
                                    </Button>
                                    <Button
                                        onClick={() => setLocation("/auth")}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Mail className="mr-2 h-4 w-4" />
                                        Back to Login
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="resend-email">Email Address</Label>
                                        <Input
                                            id="resend-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter the email address you used to register
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                if (email) {
                                                    resendMutation.mutate(email);
                                                }
                                            }}
                                            disabled={!email || resendMutation.isPending}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                        >
                                            {resendMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Send Link
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => setShowResendForm(false)}
                                            variant="outline"
                                            disabled={resendMutation.isPending}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
