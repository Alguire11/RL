import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Clock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmailEnforced() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    // Get email from query param if available
    const searchParams = new URLSearchParams(window.location.search);
    const email = searchParams.get("email");

    const [timeLeft, setTimeLeft] = useState(0);
    const canResend = timeLeft === 0;

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [timeLeft]);

    const resendMutation = useMutation({
        mutationFn: async () => {
            if (!email) throw new Error("No email address provided");
            await apiRequest("POST", "/api/auth/resend-verification", { email });
        },
        onSuccess: () => {
            toast({
                title: "Email Sent",
                description: "A new verification link has been sent to your email.",
            });
            setTimeLeft(120); // 2 minutes cooldown
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to send email",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>No email address found. Please try logging in again.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setLocation("/auth")} className="w-full">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated mesh background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
            </div>

            {/* Back to Login - Top Right */}
            <div className="absolute top-6 right-6 z-20">
                <Button
                    onClick={() => setLocation("/auth")}
                    variant="ghost"
                    className="text-white hover:bg-white/10 hover:text-white"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Button>
            </div>

            <div className="max-w-md w-full relative z-10 animate-fade-in">
                <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
                    <CardContent className="pt-8 px-8 pb-8 space-y-6 flex flex-col items-center">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-2">
                            <img src="/logo-email.png" alt="RentLedger" className="w-10 h-10 object-contain" />
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">RentLedger</span>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
                            <p className="text-gray-500">
                                We've sent a verification link to <strong className="text-gray-900">{email}</strong>.<br />
                                Please check your inbox to continue.
                            </p>
                        </div>

                        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start text-left">
                            <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">
                                You must verify your email address before you can access your dashboard.
                            </p>
                        </div>

                        <Button
                            onClick={() => resendMutation.mutate()}
                            disabled={!canResend || resendMutation.isPending}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 py-6 text-lg font-semibold shadow-lg shadow-blue-500/20"
                            variant="outline"
                        >
                            {resendMutation.isPending ? (
                                "Sending..."
                            ) : !canResend ? (
                                `Resend email in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                            ) : (
                                "Resend Verification Email"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

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
