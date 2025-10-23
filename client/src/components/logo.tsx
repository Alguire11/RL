import { cn } from "@/lib/utils";
import logoImage from "@assets/image_1761237675307.png";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <img src={logoImage} alt="RentLedger" className="h-10 w-10" />
      <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        RentLedger
      </span>
    </div>
  );
}
