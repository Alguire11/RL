import { Link } from "wouter";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-gray-600">
              Build your credit history through rent payments
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/product" className="text-sm text-gray-600 hover:text-blue-600">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="text-sm text-gray-600 hover:text-blue-600">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-blue-600">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-blue-600">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-blue-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-sm text-gray-600 hover:text-blue-600">
                  Status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © 2025 RentLedger. All rights reserved. | <a href="mailto:support@rentledger.co.uk" className="hover:text-blue-600">support@rentledger.co.uk</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
