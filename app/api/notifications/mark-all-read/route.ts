import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    await prisma.notification.updateMany({
      where: {
        userId: user.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return successResponse({ message: "All notifications marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
