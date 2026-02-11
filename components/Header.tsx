"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { getTotalItems } = useCartStore();
  const { favorites } = useFavoritesStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => mounted && pathname === path;

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (pathname !== "/") {
      router.push(`/#${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="bg-white shadow-elegant sticky top-0 z-45 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-24">
          <Link
            href="/"
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.jpg"
              alt="Orgobloom Logo"
              width={400}
              height={130}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/"
              className={`font-medium transition-colors ${
                isActive("/")
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`font-medium transition-colors ${
                isActive("/products")
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }`}
            >
              Products
            </Link>
            <button
              onClick={() => scrollToSection("about")}
              className="font-medium text-gray-700 hover:text-green-700 transition-colors"
            >
              About Us
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="hover:text-green-700"
            >
              Contact
            </button>
            {session && status === "authenticated" && (
              <>
                {session.user?.role === "CUSTOMER" && (
                  <Link
                    href="/dashboard"
                    className={`hover:text-green-700 ${
                      isActive("/dashboard")
                        ? "text-green-700 font-semibold"
                        : ""
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                {session.user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className={`hover:text-green-700 ${
                      isActive("/admin") ? "text-green-700 font-semibold" : ""
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-6"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          <div className="flex items-center gap-4">
            {/* Favorites Icon */}
            <Link href="/favorites" className="relative group">
              <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg
                  className="w-6 h-6 text-gray-700 group-hover:text-green-700 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link href="/cart" className="relative group">
              <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg
                  className="w-6 h-6 text-gray-700 group-hover:text-green-700 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* Auth Section */}
            {status === "authenticated" && session?.user ? (
              <div className="relative">
                {/* Profile Button */}
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-semibold">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {session.user.name?.split(" ")[0] || "Account"}
                  </span>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Orders
                    </Link>

                    {session.user.role === "ADMIN" && (
                      <>
                        <div className="border-t border-gray-100" />
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Admin Panel
                        </Link>
                      </>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : status === "unauthenticated" ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
