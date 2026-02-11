import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!notification) {
      throw new ApiError("Notification not found", 404);
    }

    // Mark as read
    await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });

    return successResponse({ message: "Notification marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!notification) {
      throw new ApiError("Notification not found", 404);
    }

    await prisma.notification.delete({
      where: { id: params.id },
    });

    return successResponse({ message: "Notification deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
