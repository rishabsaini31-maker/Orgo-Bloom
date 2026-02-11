import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const requestRefundSchema = z.object({
  reason: z.string().min(10, "Please provide a detailed reason"),
});

export const dynamic = "force-dynamic";

// Customer: Request refund
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
    const validatedData = requestRefundSchema.parse(body);

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

    // Check if refund already requested
    const existingRefund = await prisma.refund.findUnique({
      where: { orderId: order.id },
    });

    if (existingRefund) {
      throw new ApiError("Refund already requested for this order", 400);
    }

    // Only allow refunds for completed payments
    if (order.paymentStatus !== "COMPLETED") {
      throw new ApiError("Cannot request refund for unpaid orders", 400);
    }

    // Create refund request
    const refund = await prisma.refund.create({
      data: {
        orderId: order.id,
        amount: order.total,
        reason: validatedData.reason,
        status: "PENDING",
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.userId,
        title: "Refund Requested",
        message: `Your refund request for order #${order.orderNumber} has been submitted.`,
        type: "ORDER",
        link: `/dashboard`,
      },
    });

    return successResponse({
      message: "Refund request submitted successfully",
      refund,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Customer: Get refund status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    const refund = await prisma.refund.findUnique({
      where: { orderId: order.id },
    });

    return successResponse({ refund });
  } catch (error) {
    return handleApiError(error);
  }
}
