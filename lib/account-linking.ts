import { prisma } from "./prisma";

/**
 * Account Linking Utility Functions
 * Handles detection and linking of multiple authentication methods
 */

export interface LinkableAccount {
  id: string;
  email: string;
  name: string | null;
  provider: string; // "google" or "email"
}

/**
 * Check if an email is registered with a DIFFERENT authentication provider
 * @param email - User email
 * @param currentProvider - Current provider trying to authenticate ("google" or "credentials")
 * @returns The existing user if found with different provider, null otherwise
 */
export async function findExistingAccountByEmail(
  email: string,
  currentProvider: "google" | "credentials",
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!existingUser) {
      return null;
    }

    // Determine what providers are already linked
    const hasGoogleAccount = existingUser.accounts.some(
      (acc) => acc.provider === "google",
    );
    const hasPassword = !!existingUser.password;

    // If current provider is Google
    if (currentProvider === "google") {
      // If user has email/password but no Google, they're trying a new provider
      if (hasPassword && !hasGoogleAccount) {
        return {
          ...existingUser,
          detectedProvider: "email",
          message: "Email account found - linking Google...",
        };
      }
    }

    // If current provider is email/password
    if (currentProvider === "credentials") {
      // If user has OAuth but no password, they're already using OAuth
      if (hasGoogleAccount && !hasPassword) {
        return {
          ...existingUser,
          detectedProvider: "google",
          message: "Google account found - linking email...",
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[ACCOUNT_LINKING] Error finding existing account:", error);
    return null;
  }
}

/**
 * Automatically link a new provider to existing user account
 * This is called when user tries to login with a different method
 */
export async function autoLinkAccount(
  userId: string,
  provider: "google" | "credentials",
  googleAccountId?: string,
) {
  try {
    // If Google provider, create an Account entry
    if (provider === "google" && googleAccountId) {
      // Check if already linked
      const existing = await prisma.account.findFirst({
        where: {
          userId,
          provider: "google",
        },
      });

      if (!existing) {
        await prisma.account.create({
          data: {
            userId,
            type: "oauth",
            provider: "google",
            providerAccountId: googleAccountId,
          },
        });

        console.log(
          `[ACCOUNT_LINKING] Linked Google account to user ${userId}`,
        );
      }
    }

    return true;
  } catch (error) {
    console.error("[ACCOUNT_LINKING] Error linking account:", error);
    return false;
  }
}

/**
 * Get all authentication methods linked to a user
 */
export async function getLinkedAuthMethods(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });

    if (!user) {
      return null;
    }

    const methods = {
      email_password: !!user.password,
      google: user.accounts.some((acc) => acc.provider === "google"),
      all: [] as string[],
    };

    if (methods.email_password) methods.all.push("email_password");
    if (methods.google) methods.all.push("google");

    return methods;
  } catch (error) {
    console.error("[ACCOUNT_LINKING] Error getting linked methods:", error);
    return null;
  }
}

/**
 * Generate notification message about linked accounts
 */
export function getLinkingNotificationMessage(linkedProvider: string): string {
  const messages: Record<string, string> = {
    google:
      "Your Google account has been linked! You can now login with either Google or email/password.",
    email:
      "Your email account has been linked! You can now login with either Google or email/password.",
  };

  return (
    messages[linkedProvider] || "Your accounts have been linked successfully!"
  );
}
