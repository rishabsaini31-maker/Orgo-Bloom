import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

/**
 * POST /api/auth/link-account
 * Link another authentication method to the current user's account
 * This allows users to use multiple login methods (Google, Email/Password) on the same account
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { provider, providerId } = await request.json();

    if (!provider || !providerId) {
      throw new ApiError("Provider and providerId are required", 400);
    }

    // Check if this provider is already linked to another user
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider,
        providerAccountId: providerId,
        userId: { not: user.userId }, // Different user
      },
    });

    if (existingAccount) {
      throw new ApiError("This account is already linked to another user", 400);
    }

    // Link the account
    await prisma.account.create({
      data: {
        userId: user.userId,
        type: "oauth",
        provider,
        providerAccountId: providerId,
      },
    });

    return successResponse(
      { message: `${provider} account linked successfully` },
      200,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/auth/linked-accounts
 * Get all linked authentication methods for current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        accounts: {
          select: {
            provider: true,
            type: true,
          },
        },
      },
    });

    if (!dbUser) {
      throw new ApiError("User not found", 404);
    }

    const linkedMethods = {
      email_password: !!dbUser.password,
      accounts: dbUser.accounts.map((acc) => ({
        provider: acc.provider,
        type: acc.type,
      })),
    };

    return successResponse({ linkedMethods });
  } catch (error) {
    return handleApiError(error);
  }
}
