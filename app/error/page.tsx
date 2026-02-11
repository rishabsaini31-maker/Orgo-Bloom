"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    OAuthCallback: "There was an issue connecting your Google account.",
    OAuthSignin: "Unable to connect to Google Sign-In.",
    OAuthCreateAccount: "Could not create account with Google.",
    EmailSigninError: "Email sign-in is not available.",
    CredentialsSignin: "Invalid email or password.",
    Default: "An authentication error occurred.",
  };

  const message = errorMessages[error as string] || errorMessages.Default;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-green-700">Orgobloom</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600">
            We encountered an issue during sign-in
          </p>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            {/* Error Message */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-semibold">{message}</p>
            </div>

            {/* Error Code */}
            {error && (
              <p className="text-xs text-gray-500 text-center mb-6">
                Error Code: {error}
              </p>
            )}

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
                className="block w-full px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg text-center transition-all duration-200"
              >
                Back to Sign In
              </Link>
              <Link
                href="/"
                className="block w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg text-center transition-all duration-200"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>
            If the problem persists, please{" "}
            <Link href="/contact" className="text-green-700 hover:underline">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
