import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
    password: string;
    className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
    const strength = useMemo(() => {
        if (!password) return { score: 0, label: "", color: "" };

        let score = 0;

        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Character variety
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        // Determine strength label and color
        if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
        if (score <= 4) return { score, label: "Fair", color: "bg-orange-500" };
        if (score <= 5) return { score, label: "Good", color: "bg-yellow-500" };
        return { score, label: "Strong", color: "bg-green-500" };
    }, [password]);

    if (!password) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className={cn("text-xs font-medium",
                    strength.score <= 2 ? "text-red-600" :
                        strength.score <= 4 ? "text-orange-600" :
                            strength.score <= 5 ? "text-yellow-600" :
                                "text-green-600"
                )}>
                    {strength.label}
                </span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                    <div
                        key={level}
                        className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-300",
                            level <= strength.score ? strength.color : "bg-gray-200"
                        )}
                    />
                ))}
            </div>
            {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-red-600">At least 8 characters required</p>
            )}
        </div>
    );
}
