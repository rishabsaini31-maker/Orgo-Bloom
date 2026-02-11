import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = cancelOrderSchema.parse(body);

    // Get order
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["PENDING", "PROCESSING"];
    if (!cancellableStatuses.includes(order.status)) {
      throw new ApiError(
        "Order cannot be cancelled. It has already been shipped or delivered.",
        400,
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: validatedData.reason,
      },
    });

    // Add to order status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        notes: `Cancelled by customer. Reason: ${validatedData.reason || "No reason provided"}`,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.userId,
        title: "Order Cancelled",
        message: `Your order #${order.orderNumber} has been cancelled.`,
        type: "ORDER",
        link: `/dashboard`,
      },
    });

    return successResponse({
      message: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
