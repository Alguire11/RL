import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("bg-gray-900 text-white py-12 mt-auto", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/product" className="text-gray-400 hover:text-white">Features</Link></li>
              <li><Link href="/subscribe" className="text-gray-400 hover:text-white">Pricing</Link></li>
              <li><Link href="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/support" className="text-gray-400 hover:text-white">Support Center</Link></li>
              <li><Link href="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link href="/status" className="text-gray-400 hover:text-white">Status</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Legal & Security</h3>
            <ul className="space-y-2">
              <li><Link href="/trust" className="text-gray-400 hover:text-white">Trust & Security</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">RentLedger</h3>
            <p className="text-gray-400">
              Building credit through rent payments, one payment at a time.
            </p>
          </div>
        </div>

        <hr className="my-8 border-gray-800" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">&copy; 2025 RentLedger. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
            <a href="mailto:support@rentledger.co.uk" className="text-gray-400 hover:text-white">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
