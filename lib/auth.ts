import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "./prisma";
import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ============================================================================
// NextAuth Configuration - Google OAuth only
// ============================================================================

// Validate required environment variables
function validateEnv() {
  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ];

  const missing = required.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

// Note: Validation moved to authenticateRequest() to avoid build-time failures
// Environment validation now happens only at request time, not during build

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database integration
  // Note: When using adapter with OAuth, we still use JWT for sessions
  adapter: PrismaAdapter(prisma),

  // Configure JWT session strategy
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update token daily
  },

  // Providers: Google OAuth + Email/Password
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Check if user has a password (email/password users should have one)
        if (!user.password) {
          throw new Error(
            "This email is registered with Google. Please use Google Sign-In.",
          );
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  // Pages
  pages: {
    signIn: "/login",
    error: "/error",
  },

  // Callbacks for custom logic
  callbacks: {
    // JWT callback - add user role to token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "CUSTOMER";
        token.email = user.email;
        token.image = user.image || null;
      }
      return token;
    },

    // Session callback - include JWT data in session
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          email: token.email as string,
          image: (token.image as string | null) || null,
        };
      }
      return session;
    },

    // Redirect callback - redirect to dashboard after login
    async redirect({ url, baseUrl }) {
      // If the URL is just a relative path, consider it valid
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Verify the URL is on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/dashboard";
    },

    // Sign in callback - handle OAuth and Credentials
    async signIn({ user, account, profile }) {
      try {
        // For Google OAuth provider
        if (account?.provider === "google") {
          if (!user.email) {
            console.error("[AUTH] No email provided by Google");
            return false;
          }

          // Check if user already exists with password authentication
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true }, // Include OAuth accounts
          });

          // If user exists with a password (email/password auth) but no OAuth accounts, prevent OAuth sign-in
          if (
            existingUser &&
            existingUser.password &&
            existingUser.accounts.length === 0
          ) {
            console.error(
              "[AUTH] Email already registered with password. Please use email/password login.",
            );
            return "/error?error=OAuthAccountNotLinked";
          }

          // Allow sign-in for new users or existing OAuth users
          console.log(
            `[AUTH] Google OAuth sign-in successful for ${user.email}`,
          );
          return true;
        }

        // For Credentials provider, validation is done in authorize
        return true;
      } catch (error) {
        console.error("[AUTH] Sign-in callback error:", error);
        return false;
      }
    },
  },

  // Events for logging (avoid logging sensitive data)
  events: {
    async signIn({ user }) {
      console.log(`[AUTH] User signed in: ${user?.email}`);
    },
    async signOut() {
      console.log("[AUTH] User signed out");
    },
  },

  // Custom logging
  logger: {
    error: (code, ...message) => {
      console.error(`[next-auth] ${code}`, ...message);
    },
    warn: (code, ...message) => {
      console.warn(`[next-auth] ${code}`, ...message);
    },
    debug: (code, ...message) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[next-auth] ${code}`, ...message);
      }
    },
  },

  // Ensure secure cookies in production
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-next-auth.callback-url`
          : `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-next-auth.csrf-token`
          : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

// ============================================================================
// Session and Authentication Utilities
// ============================================================================

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export function isAdmin(user: { role?: string }): boolean {
  return user.role === "ADMIN";
}

// Session Management - Logout all devices
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

// ============================================================================
// Compatibility Functions for Existing API Routes
// ============================================================================

/**
 * @deprecated Use getServerSession instead
 * Legacy function for backward compatibility with existing API routes
 */
export interface LegacyTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function authenticateRequest(
  request: NextRequest,
): Promise<LegacyTokenPayload | null> {
  // Validate environment variables at request time, not build time
  validateEnv();

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email || "",
    role: session.user.role || "CUSTOMER",
  };
}
// ============================================================================
// Legacy Password Functions (for backward compatibility)
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: LegacyTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): LegacyTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as LegacyTokenPayload;
  } catch (error) {
    return null;
  }
}

export async function verifyAuth(request: NextRequest): Promise<{
  user: LegacyTokenPayload | null;
  token: string | null;
}> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { user: null, token: null };
  }
  const user = verifyToken(token);
  if (!user) return { user: null, token: null };

  // For legacy JWT tokens, we don't need database session validation
  // The token itself contains all necessary user information
  return { user, token };
}
