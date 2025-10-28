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
    primary: "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90",
    secondary: "bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90",
    accent: "bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90",
  };

  return (
    <Button
      className={cn(
        "text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
