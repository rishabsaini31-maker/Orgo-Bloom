"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

type LoginTab = "google" | "email";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<LoginTab>("google");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn("google", {
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Failed to sign in with Google. Please try again.");
        console.error("[AUTH] Google sign-in error:", result.error);
      } else if (result?.ok) {
        // Redirect on success
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      console.error("[AUTH] Sign-in exception:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        console.error("[AUTH] Email login error:", result.error);
      } else if (result?.ok) {
        // Redirect on success
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      console.error("[AUTH] Email login exception:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-green-700">Orgobloom</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to access your account and continue shopping
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("google");
                setError(null);
                setEmail("");
                setPassword("");
              }}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors ${
                activeTab === "google"
                  ? "text-green-700 border-b-2 border-green-700 bg-green-50"
                  : "text-gray-600 hover:text-gray-900 bg-gray-50"
              }`}
            >
              Google
            </button>
            <button
              onClick={() => {
                setActiveTab("email");
                setError(null);
              }}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors ${
                activeTab === "email"
                  ? "text-green-700 border-b-2 border-green-700 bg-green-50"
                  : "text-gray-600 hover:text-gray-900 bg-gray-50"
              }`}
            >
              Email
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Google Tab */}
            {activeTab === "google" && (
              <div>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 rounded-lg font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-600 mt-6">
                  Your account will be created automatically on first login.
                </p>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === "email" && (
              <form onSubmit={handleEmailLogin}>
                {/* Email Input */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                {/* Password Input */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-green-700 hover:text-green-800"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-gray-600 mt-4">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-green-700 hover:text-green-800"
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            )}
          </div>

          {/* Back Link */}
          <div className="px-8 py-4 border-t border-gray-100 flex justify-center">
            <Link
              href="/"
              className="text-sm text-green-700 hover:text-green-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-green-700 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-green-700 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
