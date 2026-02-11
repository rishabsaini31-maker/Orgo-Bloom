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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowMobileSearch(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showMobileMenu]);

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
    <header className="bg-white shadow-elegant sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-16 sm:h-20 lg:h-24">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {showMobileMenu ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.jpg"
              alt="Orgobloom Logo"
              width={400}
              height={130}
              className="h-12 sm:h-16 lg:h-20 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
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
              className="font-medium text-gray-700 hover:text-green-700 transition-colors"
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

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-6"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 lg:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm lg:text-base"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400"
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

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <svg
                className="w-5 h-5 text-gray-700"
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
            </button>

            {/* Favorites Icon */}
            <Link href="/favorites" className="relative group">
              <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-green-700 transition-colors"
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
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link href="/cart" className="relative group">
              <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-green-700 transition-colors"
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
                <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* Auth Section - Desktop */}
            {status === "authenticated" && session?.user ? (
              <div className="relative hidden sm:block">
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
                      className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-semibold">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="hidden md:inline text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {session.user.name?.split(" ")[0] || "Account"}
                  </span>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session.user.email}
                        </p>
                      </div>

                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Dashboard
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

                      <div className="border-t border-gray-100" />
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
                  </>
                )}
              </div>
            ) : status === "unauthenticated" ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                  autoFocus
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
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed top-0 left-0 bottom-0 w-64 sm:w-80 bg-white z-50 lg:hidden shadow-2xl overflow-y-auto mobile-menu-enter">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
              </div>

              {/* User Info in Mobile Menu */}
              {session?.user && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-semibold">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Navigation Links */}
            <nav className="p-4 space-y-2">
              <Link
                href="/"
                className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive("/")
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Home
              </Link>
              <Link
                href="/products"
                className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive("/products")
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Products
              </Link>
              <button
                onClick={() => {
                  scrollToSection("about");
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                About Us
              </button>
              <button
                onClick={() => {
                  scrollToSection("contact");
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Contact
              </button>

              {session && status === "authenticated" && (
                <>
                  <div className="border-t border-gray-200 my-2" />
                  {session.user?.role === "CUSTOMER" && (
                    <Link
                      href="/dashboard"
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                        isActive("/dashboard")
                          ? "bg-green-50 text-green-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Dashboard
                    </Link>
                  )}
                  {session.user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                        isActive("/admin")
                          ? "bg-green-50 text-green-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Admin Panel
                    </Link>
                  )}
                </>
              )}

              {status === "unauthenticated" && (
                <>
                  <div className="border-t border-gray-200 my-2" />
                  <Link
                    href="/login"
                    className="block px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-3 rounded-lg font-medium text-white bg-green-700 hover:bg-green-800 transition-colors text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {session && (
                <>
                  <div className="border-t border-gray-200 my-2" />
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
