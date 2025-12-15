import { useState } from "react";
import { Link, useLocation } from "wouter";
import { getAppUrl } from "@/lib/domain-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Menu, X, Building, Users, Scale, Shield, ChevronDown } from "lucide-react";

export function PublicNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    window.location.href = getAppUrl('/auth?tab=signup');
  };

  const handleSignIn = () => {
    window.location.href = getAppUrl('/auth');
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
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Home
            </Link>

            {/* Company Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 text-gray-600 hover:text-primary">
                  <Building className="w-4 h-4" />
                  <span>Company</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/about" className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    About Us
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/privacy" className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/terms" className="flex items-center">
                    <Scale className="mr-2 h-4 w-4" />
                    Terms of Service
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/contact" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleSignIn}
              className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Sign In
            </Button>
            <Button
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 md:hidden">
          <div className="pt-16 pb-6 px-4">
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-4">
              <Link
                href="/"
                className="block text-gray-900 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="block text-gray-600 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="block text-gray-600 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="block text-gray-600 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="block text-gray-600 hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <hr className="my-4" />
              <Button
                variant="outline"
                onClick={handleSignIn}
                className="block w-full text-left text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 px-3 py-2 rounded-md text-base font-medium"
              >
                Sign In
              </Button>
              <Button
                onClick={handleGetStarted}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}