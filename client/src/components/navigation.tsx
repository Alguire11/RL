import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BarChart3, FileText, Settings, LogOut, User, Shield, Building, Users, Scale, ChevronDown, History, PlusCircle, TrendingUp, Upload } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is admin
  const { data: adminUser } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
    enabled: !!user && user.role === "admin",
  });

  const isAdmin = user?.role === "admin" && !!adminUser;

  // Don't show Dashboard when already on dashboard
  const isOnDashboard = location === "/" || location === "/dashboard";

  const navItems = [
    ...(isOnDashboard ? [] : [{ path: "/", label: "Dashboard", icon: BarChart3 }]),
    { path: "/credit-builder", label: "Credit Builder", icon: TrendingUp },
    { path: "/manual-verify", label: "Manual Verification", icon: Upload },
    { path: "/settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/dashboard" && location === "/") return true;
    if (path !== "/" && location === path) return true;
    return false;
  };

  const handleSignOut = async () => {
    try {
      await apiRequest("POST", "/api/logout", {});
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  const getUserInitials = (user: any) => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 ml-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <span
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${isActive(item.path)
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}

            {/* Reports Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${location === '/report-generator' || location === '/reports'
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Reports</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/report-generator">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Generate New Report</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/reports">
                    <History className="mr-2 h-4 w-4" />
                    <span>My Report History</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4 ml-4">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-blue-50 transition-colors">
                  <Avatar className="h-9 w-9 border-2 border-transparent hover:border-blue-200 transition-colors">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.email || "User"} />
                    <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && user?.lastName && (
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/reports">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-4">
                  <div className="flex items-center space-x-2 pb-4 border-b">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl} alt={user?.email || "User"} />
                      <AvatarFallback className="text-sm">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {user?.firstName && user?.lastName && (
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path}>
                        <a
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${isActive(item.path)
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    );
                  })}

                  {/* Reports Section */}
                  <div className="space-y-1">
                    <Link href="/report-generator">
                      <a
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <PlusCircle className="w-5 h-5" />
                        <span>Generate Report</span>
                      </a>
                    </Link>
                    <Link href="/reports">
                      <a
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <History className="w-5 h-5" />
                        <span>Report History</span>
                      </a>
                    </Link>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
