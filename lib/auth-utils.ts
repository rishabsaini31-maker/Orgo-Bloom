/**
 * API Route Protection Utilities
 * Provides helper functions to protect API routes with authentication
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Get the current session on the server
 * Use this in API routes or server components
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Protect an API route - requires authentication
 */
export async function protectRoute(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Please sign in" },
      { status: 401 },
    );
  }

  return { session, user: session.user };
}

/**
 * Protect an API route for admin only
 */
export async function protectAdminRoute(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Please sign in" },
      { status: 401 },
    );
  }

  if (session.user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 },
    );
  }

  return { session, user: session.user };
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: string | undefined, requiredRole: string) {
  return userRole === requiredRole;
}

/**
 * Validate request is authenticated
 * Returns null if not authenticated
 */
export async function validateAuth() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
