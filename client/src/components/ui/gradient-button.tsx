import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/components/ui/button";

type GradientVariant = "primary" | "secondary" | "accent";

type GradientButtonProps = Omit<ButtonProps, "variant"> & {
  variant?: GradientVariant;
};

export function GradientButton({ 
  children, 
  className, 
  variant = "primary", 
  ...props 
}: GradientButtonProps) {
  const variantClasses = {
    primary: "bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] hover:from-[#1e40af] hover:to-[#1e3a8a]",
    secondary: "bg-gradient-to-r from-[#2563eb] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#2563eb]",
    accent: "bg-gradient-to-r from-[#1e40af] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#1e40af]",
  };

  return (
    <Button
      className={cn(
        "text-white font-medium hover:text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
