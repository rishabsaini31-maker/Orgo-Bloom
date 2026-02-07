import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!userData) {
      throw new ApiError("User not found", 404);
    }

    return successResponse({ user: userData });
  } catch (error) {
    return handleApiError(error);
  }
}
