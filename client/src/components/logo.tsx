import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("text-2xl font-bold", className)}>
      <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Enoíkio
      </span>
    </div>
  );
}
