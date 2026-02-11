"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You were denied access to sign in.",
    Callback: "There was an error in the callback handler route.",
    OAuthSignin: "Error constructing an authorization URL.",
    OAuthCallback: "Error handling the OAuth callback.",
    EmailSigninEmail: "Sending the email with the verification link failed.",
    EmailCreateAccount: "Email account creation failed.",
    EmailSignInError: "Could not send magic sign in email.",
    SessionCallback: "JWT session callback error.",
    JWTCreationError: "Error creating JWT token.",
    SessionExpired: "Your session has expired. Please sign in again.",
    Default: "An authentication error occurred. Please try again.",
  };

  const errorMessage =
    errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-green-700">Orgobloom</h1>
          </Link>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Authentication Error
          </h2>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Message */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 text-center">{errorMessage}</p>
            {error && (
              <p className="text-xs text-red-600 text-center mt-2 font-mono">
                Error code: {error}
              </p>
            )}
          </div>

          {/* Troubleshooting Tips */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              What you can try:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Clear your browser cookies and try again</li>
              <li>Make sure you&apos;re using a supported browser</li>
              <li>Try using a different Google account</li>
              <li>Check that your internet connection is stable</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="block text-center w-full px-4 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="block text-center w-full px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* Support */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Still having trouble?</p>
            <Link
              href="/contact"
              className="text-sm text-green-700 hover:text-green-800 font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
