"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-12 sm:mt-16 lg:mt-20">
      <div className="container mx-auto px-4 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl font-bold text-primary-400 mb-3 sm:mb-4">
              Orgobloom
            </h3>
            <p className="text-gray-400 text-sm sm:text-base">
              Premium organic cow manure fertilizers for healthy gardens and
              farms.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
              Quick Links
            </h4>
            <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
              <li>
                <Link
                  href="/products"
                  className="hover:text-primary-400 transition-colors inline-block"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary-400 transition-colors inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary-400 transition-colors inline-block"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
              Customer Service
            </h4>
            <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-primary-400 transition-colors inline-block"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="hover:text-primary-400 transition-colors inline-block"
                >
                  Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-primary-400 transition-colors inline-block"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
              Contact Us
            </h4>
            <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
              <li className="break-words">Email: support@orgobloom.com</li>
              <li>Phone: +91 1234567890</li>
              <li>Mon-Sat: 9AM - 6PM</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-xs sm:text-sm">
          <p>
            &copy; {new Date().getFullYear()} Orgobloom. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
