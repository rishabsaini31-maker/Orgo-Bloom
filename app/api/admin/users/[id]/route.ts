import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const blockUserSchema = z.object({
  action: z.enum(["BLOCK", "UNBLOCK"]),
  reason: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const body = await request.json();
    const validatedData = blockUserSchema.parse(body);

    // Get user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      throw new ApiError("User not found", 404);
    }

    if (targetUser.role === "ADMIN") {
      throw new ApiError("Cannot block admin users", 400);
    }

    const isBlocking = validatedData.action === "BLOCK";

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isBlocked: isBlocking,
        blockedAt: isBlocking ? new Date() : null,
        blockedReason: isBlocking ? validatedData.reason : null,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: params.id,
        title: isBlocking ? "Account Blocked" : "Account Unblocked",
        message: isBlocking
          ? `Your account has been blocked. ${validatedData.reason || ""}`
          : "Your account has been unblocked.",
        type: "SYSTEM",
      },
    });

    return successResponse({
      message: `User ${isBlocking ? "blocked" : "unblocked"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
