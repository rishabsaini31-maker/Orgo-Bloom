import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const processRefundSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional(),
});

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
    const validatedData = processRefundSchema.parse(body);

    // Get refund
    const refund = await prisma.refund.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!refund) {
      throw new ApiError("Refund not found", 404);
    }

    if (refund.status !== "PENDING") {
      throw new ApiError("Refund has already been processed", 400);
    }

    const newStatus =
      validatedData.action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Update refund
    const updatedRefund = await prisma.refund.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        processedAt: new Date(),
        processedBy: user.userId,
        notes: validatedData.notes,
      },
    });

    // Update order status if approved
    if (validatedData.action === "APPROVE") {
      await prisma.order.update({
        where: { id: refund.orderId },
        data: {
          paymentStatus: "REFUNDED",
          status: "CANCELLED",
        },
      });
    }

    // Create notification for customer
    await prisma.notification.create({
      data: {
        userId: refund.order.userId,
        title: `Refund ${newStatus}`,
        message: `Your refund request for order #${refund.order.orderNumber} has been ${newStatus.toLowerCase()}.`,
        type: "ORDER",
        link: `/dashboard`,
      },
    });

    return successResponse({
      message: `Refund ${newStatus.toLowerCase()} successfully`,
      refund: updatedRefund,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
