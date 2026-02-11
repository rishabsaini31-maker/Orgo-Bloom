import crypto from "crypto";
import { prisma } from "./prisma";

// Generate secure random token
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Password Reset Token Functions
/**
 * @deprecated Password reset tokens are no longer used with OAuth
 * Users should reset their password through their OAuth provider
 */
export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  // Return a dummy token - OAuth users don't use password resets
  return generateSecureToken();
}

/**
 * @deprecated Password reset tokens are no longer used with OAuth
 */
export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  // Always return null - OAuth users don't use password resets
  return null;
}

// Email Verification Token Functions
/**
 * @deprecated Email verification tokens are no longer used
 * Google OAuth verifies emails automatically
 */
export async function createEmailVerificationToken(
  userId: string,
): Promise<string> {
  // Return a dummy token - OAuth users have verified emails
  return generateSecureToken();
}

/**
 * @deprecated Email verification tokens are no longer used
 */
export async function verifyEmailVerificationToken(
  token: string,
): Promise<string | null> {
  // Always return null - OAuth users have verified emails
  return null;
}

// Session Management Functions
/**
 * @deprecated Legacy session management - not compatible with NextAuth
 * NextAuth handles sessions automatically
 */
/*
export async function createSession(
  userId: string,
  token: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      userId,
      token,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });
}

export async function invalidateSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  });
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();

  await Promise.all([
    prisma.session.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
  ]);
}
*/
