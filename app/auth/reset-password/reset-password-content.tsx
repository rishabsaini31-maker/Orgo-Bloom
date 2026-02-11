"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { authApi } from "@/lib/api-client";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

export default function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    token: token || "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordValid = () => {
    const password = formData.password;
    // At least one uppercase, one lowercase, one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLengthValid = password.length >= 8;

    return hasUppercase && hasLowercase && hasNumber && isLengthValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    if (!formData.password) {
      toast.error("Please enter a password");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isPasswordValid()) {
      toast.error(
        "Password must be at least 8 characters, with at least one uppercase, lowercase, and number",
      );
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token: formData.token,
        password: formData.password,
      });

      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        "Password reset failed. Link may be expired.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600 mb-6">
                The password reset link is missing or invalid. Please request a
                new link.
              </p>
              <Link href="/auth/forgot-password" className="btn btn-primary">
                Request New Link
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="bg-primary-600 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="text-primary-100">
              Create a new password for your account
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p>
                    ✓ At least 8 characters{" "}
                    {formData.password.length >= 8 ? "✓" : ""}
                  </p>
                  <p>
                    ✓ Uppercase letter{" "}
                    {/[A-Z]/.test(formData.password) ? "✓" : ""}
                  </p>
                  <p>
                    ✓ Lowercase letter{" "}
                    {/[a-z]/.test(formData.password) ? "✓" : ""}
                  </p>
                  <p>✓ Number {/[0-9]/.test(formData.password) ? "✓" : ""}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid()}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
