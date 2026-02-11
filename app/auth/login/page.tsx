"use client";

export const dynamic = "force-dynamic";

// This page is deprecated - use /login instead
// Redirect users to the main login page
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to login...</p>
    </div>
  );
}
