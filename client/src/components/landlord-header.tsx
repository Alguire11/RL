import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building, Users, CheckCircle, MapPin, FileText } from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";

interface LandlordHeaderProps {
    user: any;
    plan?: any;
    activePage: 'dashboard' | 'properties' | 'tenants' | 'verifications' | 'reports' | 'maintenance';
}

export function LandlordHeader({ user, plan, activePage }: LandlordHeaderProps) {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
            };

            const csrfToken = getCookie('XSRF-TOKEN');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (csrfToken) {
                headers['X-XSRF-TOKEN'] = csrfToken;
            }

            await fetch('/api/logout', {
                method: 'POST',
                headers,
                credentials: 'include',
            });
            toast({
                title: "Logged Out",
                description: "You have been logged out successfully.",
            });
            setLocation('/landlord-login');
        } catch (error) {
            console.error('Logout error:', error);
            setLocation('/landlord-login');
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Building, path: '/landlord-dashboard' },
        { id: 'properties', label: 'Properties', icon: MapPin, path: '/landlord-properties' },
        { id: 'tenants', label: 'Tenants', icon: Users, path: '/landlord-tenants' },
        { id: 'verifications', label: 'Verifications', icon: CheckCircle, path: '/landlord-verifications' },
        { id: 'reports', label: 'Reports', icon: FileText, path: '/landlord-reports' },
        // V3: Maintenance feature - to be implemented later
        // { id: 'maintenance', label: 'Maintenance', icon: FileText, path: '/landlord-maintenance' },
    ];

    return (
        <header className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <Logo />
                    </div>

                    <nav className="flex space-x-1 mx-8">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage === item.id;
                            return (
                                <Button
                                    key={item.id}
                                    variant="ghost"
                                    className={
                                        isActive
                                            ? "text-blue-600 border-b-2 border-blue-600 rounded-none hover:bg-blue-50 hover:text-blue-700"
                                            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-none border-b-2 border-transparent hover:border-blue-200"
                                    }
                                    onClick={() => setLocation(item.path)}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {item.label}
                                </Button>
                            );
                        })}
                    </nav>

                    <div className="flex-1"></div>

                    <div className="flex items-center space-x-4">
                        {plan && (
                            <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 font-semibold">
                                {plan.name} Plan
                            </Badge>
                        )}

                        <Button variant="ghost" size="icon" className="relative">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar>
                                        <AvatarFallback className="bg-blue-600 text-white">
                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
}
