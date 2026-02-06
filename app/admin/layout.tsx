"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // Allow access to /admin/login without authentication
    if (pathname === "/admin/login") {
      return;
    }

    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, user, router, pathname]);

  // Allow /admin/login to render without authentication check
  if (pathname === "/admin/login") {
    return children;
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link
                href="/admin"
                className="text-2xl font-bold text-primary-600"
              >
                Orgobloom Admin
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/admin"
                  className={`hover:text-primary-600 ${isActive("/admin") && pathname === "/admin" ? "text-primary-600 font-semibold" : ""}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/products"
                  className={`hover:text-primary-600 ${isActive("/admin/products") ? "text-primary-600 font-semibold" : ""}`}
                >
                  Products
                </Link>
                <Link
                  href="/admin/videos"
                  className={`hover:text-primary-600 ${isActive("/admin/videos") ? "text-primary-600 font-semibold" : ""}`}
                >
                  Videos
                </Link>
                <Link
                  href="/admin/orders"
                  className={`hover:text-primary-600 ${isActive("/admin/orders") ? "text-primary-600 font-semibold" : ""}`}
                >
                  Orders
                </Link>
                <Link
                  href="/admin/settings"
                  className={`hover:text-primary-600 ${isActive("/admin/settings") ? "text-primary-600 font-semibold" : ""}`}
                >
                  Settings
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Site
              </Link>
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
