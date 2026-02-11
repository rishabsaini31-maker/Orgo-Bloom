"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { authApi } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Auto-verify if token is provided
  useEffect(() => {
    if (token && email) {
      handleVerify(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  // Countdown timer for resend
  useEffect(() => {
    if (!canResend && timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  const handleVerify = async (verifyToken: string) => {
    setLoading(true);
    try {
      await authApi.verifyEmail({
        token: verifyToken,
      });

      setVerified(true);
      toast.success("Email verified successfully!");

      setTimeout(() => {
        if (user) {
          router.push("/dashboard");
        } else {
          router.push("/auth/login");
        }
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email not found. Please sign up again.");
      return;
    }

    setResending(true);
    try {
      await authApi.resendVerificationEmail({ email });
      toast.success("Verification email sent! Check your inbox.");
      setCanResend(false);
      setTimer(60);
    } catch (error: any) {
      let errorMessage = "Failed to send verification email";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error(errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="bg-primary-600 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold">Verify Your Email</h1>
            <p className="text-primary-100">Secure your account</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            {loading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600">Verifying your email...</p>
              </div>
            ) : verified ? (
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-green-500 mx-auto animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Verified!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your email has been successfully verified. Redirecting...
                </p>
              </div>
            ) : token ? (
              <div className="text-center">
                <p className="text-gray-600">
                  Verification failed. The link may be invalid or expired.
                </p>
                <button
                  onClick={() => handleResend()}
                  disabled={!canResend || resending}
                  className="mt-6 btn btn-primary disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Request New Link"}
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  Verification Code
                </h2>
                <p className="text-gray-600 mb-6">
                  We sent a verification email to <strong>{email}</strong>
                </p>

                <div className="space-y-4 mb-6">
                  <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                    👉 Check your email for a verification link and click it to
                    verify your email address.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-xs text-gray-600 mb-2">
                    Didn&apos;t receive the email?
                  </p>
                  <button
                    onClick={() => handleResend()}
                    disabled={!canResend || resending}
                    className="text-primary-600 hover:text-primary-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending
                      ? "Sending..."
                      : canResend
                        ? "Resend verification email"
                        : `Resend in ${timer}s`}
                  </button>
                </div>

                <Link href="/auth/login" className="text-center block text-sm">
                  <span className="text-gray-600 hover:text-gray-700">
                    Back to login
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
