import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building,
    Users,
    Wrench,
    CheckCircle,
    BarChart3
} from "lucide-react";

export function LandlordNavigation() {
    const [location] = useLocation();

    const navItems = [
        {
            href: "/landlord-dashboard",
            label: "Overview",
            icon: LayoutDashboard
        },
        {
            href: "/landlord-properties",
            label: "Properties",
            icon: Building
        },
        {
            href: "/landlord-tenants",
            label: "Tenants",
            icon: Users
        },
        {
            href: "/landlord-maintenance",
            label: "Maintenance",
            icon: Wrench
        },
        {
            href: "/landlord-verifications",
            label: "Verifications",
            icon: CheckCircle
        },
        {
            href: "/landlord-analytics",
            label: "Analytics",
            icon: BarChart3
        }
    ];

    return (
        <nav className="bg-white border-b sticky top-0 z-20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8 overflow-x-auto">
                    {navItems.map((item) => {
                        const isActive = location === item.href;
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href}>
                                <a
                                    className={cn(
                                        "flex items-center px-1 py-4 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                                        isActive
                                            ? "border-[#1e3a8a] text-[#1e3a8a]"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4 mr-2", isActive ? "text-[#1e3a8a]" : "text-gray-400")} />
                                    {item.label}
                                </a>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
