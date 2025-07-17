import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "primary" | "secondary" | "success" | "accent";
  change?: {
    value: number;
    trend: "up" | "down";
  };
}

export function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  const colorClasses = {
    primary: "bg-blue-500 text-white",
    secondary: "bg-purple-500 text-white",
    success: "bg-green-500 text-white",
    accent: "bg-orange-500 text-white",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span className={change.trend === "up" ? "text-green-600" : "text-red-600"}>
              {change.trend === "up" ? "+" : "-"}{Math.abs(change.value)}%
            </span>{" "}
            from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}