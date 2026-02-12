"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface LinkedMethod {
  provider: string;
  type: string;
}

interface LinkedMethods {
  email_password: boolean;
  accounts: LinkedMethod[];
}

export default function LinkedAccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [linkedMethods, setLinkedMethods] = useState<LinkedMethods | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchLinkedAccounts();
    }
  }, [status, router]);

  const fetchLinkedAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/link-account");

      if (!response.ok) {
        throw new Error("Failed to fetch linked accounts");
      }

      const data = await response.json();
      setLinkedMethods(data.linkedMethods);
    } catch (error) {
      console.error("Error fetching linked accounts:", error);
      toast.error("Failed to load linked accounts");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Linked Accounts</h1>
          <p className="text-gray-600 mt-2">
            Manage all the login methods connected to your account
          </p>
        </div>

        {/* Cards Container */}
        <div className="space-y-4">
          {/* Email/Password */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Email & Password
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {linkedMethods?.email_password
                      ? session?.user?.email || "Connected"
                      : "Not connected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {linkedMethods?.email_password ? (
                  <>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Connected
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">Not connected</span>
                )}
              </div>
            </div>
          </div>

          {/* Google */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.91 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Google</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {linkedMethods?.accounts.some(
                      (acc) => acc.provider === "google",
                    )
                      ? "Connected via Google account"
                      : "Not connected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {linkedMethods?.accounts.some(
                  (acc) => acc.provider === "google",
                ) ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Connected
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">Not connected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900">
                Multiple Login Methods
              </h3>
              <p className="text-sm text-blue-800 mt-1">
                You can use any connected method to login to your account. All
                your data (orders, wishlist, addresses) will be accessible
                regardless of which login method you use.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-2">✓ Benefits</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Login with multiple methods</li>
              <li>• Never forget your password again</li>
              <li>• All data in one account</li>
              <li>• Enhanced security</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📧 Your Email</h4>
            <p className="text-sm text-gray-600">{session?.user?.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              This is the email attached to your account. All login methods use
              this email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
