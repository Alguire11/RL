import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";

export default function VerifyEmail() {
    const [, params] = useRoute("/verify-email/:token");
    const [, setLocation] = useLocation();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

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
                    // Redirect based on role
                    setTimeout(() => {
                        if (data.user?.role === 'landlord') {
                            setLocation("/landlord-dashboard");
                        } else if (data.user?.role === 'admin') {
                            setLocation("/admin");
                        } else {
                            setLocation("/dashboard");
                        }
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        {status === "loading" && (
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        )}
                        {status === "success" && (
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        )}
                        {status === "error" && (
                            <XCircle className="h-16 w-16 text-red-500" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {status === "loading" && "Verifying Your Email"}
                        {status === "success" && "Email Verified!"}
                        {status === "error" && "Verification Failed"}
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    {status === "success" && (
                        <p className="text-sm text-muted-foreground">
                            Redirecting you to your dashboard...
                        </p>
                    )}
                    {status === "error" && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                If your verification link has expired, you can request a new one.
                            </p>
                            <Button
                                onClick={() => setLocation("/auth")}
                                variant="outline"
                                className="w-full"
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Go to Login
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
