import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

// Protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/orders",
  "/favorites",
  "/checkout",
  "/admin",
];

// Admin-only routes
const adminRoutes = ["/admin"];

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;

    // Check if route is admin-only
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (!token || token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // Add security headers
    const response = NextResponse.next();

    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Protected routes: must have token
        if (protectedRoutes.some((route) => pathname.startsWith(route))) {
          return !!token;
        }

        // All other routes are public
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
