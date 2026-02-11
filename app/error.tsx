"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* Error Illustration */}
        <div className="mb-8">
          <svg
            className="w-64 h-64 mx-auto text-red-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          Something Went Wrong
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          We&apos;re sorry, but something unexpected happened. Our team has been
          notified and is working on it.
        </p>

        {/* Error Details (in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-8 p-4 bg-red-100 border border-red-300 rounded-lg text-left">
            <p className="font-mono text-sm text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/contact"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            If this problem persists, please contact our support team at{" "}
            <a
              href="mailto:support@orgobloom.com"
              className="text-primary-600 hover:underline"
            >
              support@orgobloom.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
