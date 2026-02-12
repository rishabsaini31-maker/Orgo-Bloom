import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const createReturnSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
});

/**
 * POST - Create a return/refund request
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const body = await request.json();
    const { orderId, reason, description, images } =
      createReturnSchema.parse(body);

    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.userId,
      },
      include: {
        user: { select: { email: true, name: true } },
        items: true,
      },
    });

    if (!order) {
      throw new ApiError("Order not found or unauthorized", 404);
    }

    // Check if order is eligible for return (within 30 days & delivered)
    const daysOld = Math.floor(
      (new Date().getTime() - order.createdAt.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (order.status !== "DELIVERED") {
      throw new ApiError(
        "Order must be delivered before requesting return",
        400,
      );
    }

    if (daysOld > 30) {
      throw new ApiError("Return period expired (30 days from delivery)", 400);
    }

    // Check if return already exists for this order
    const existingRefund = await prisma.refund.findUnique({
      where: { orderId },
    });

    if (existingRefund) {
      throw new ApiError("Return already requested for this order", 400);
    }

    // Create return request
    const refund = await prisma.refund.create({
      data: {
        orderId,
        amount: order.total,
        reason,
        status: "PENDING",
        notes: description || null,
      },
    });

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: user.userId,
        type: "SYSTEM",
        title: "Return Request submitted",
        message: `Your return request for Order #${order.orderNumber} has been submitted. We will review and get back to you within 48 hours.`,
        link: `/dashboard/orders/${order.id}`,
      },
    });

    return successResponse(
      {
        refund,
        message:
          "Return request submitted successfully. We will review within 24-48 hours.",
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET - Fetch return requests (user's own or admin all)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const whereClause: any = {};

    // If user is not admin, only get their own returns
    if (user.role !== "ADMIN") {
      const userOrders = await prisma.order.findMany({
        where: { userId: user.userId },
        select: { id: true },
      });
      const orderIds = userOrders.map((o) => o.id);
      whereClause.orderId = { in: orderIds };
    }

    if (status) {
      whereClause.status = status;
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.refund.count({ where: whereClause }),
    ]);

    return successResponse({
      data: refunds,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH - Update return status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== "ADMIN") {
      throw new ApiError("Admin access required", 403);
    }

    const body = await request.json();
    const { refundId, status, notes } = body;

    if (!refundId || !status) {
      throw new ApiError("Missing refundId or status", 400);
    }

    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(
        `Invalid status. Must be one of: ${validStatuses}`,
        400,
      );
    }

    // Update refund
    const refund = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status,
        processedAt: new Date(),
        processedBy: user.userId,
        notes: notes || undefined,
      },
      include: {
        order: {
          select: {
            userId: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    // Create notification for user
    let notificationMessage = "";
    if (status === "APPROVED") {
      notificationMessage = `Your return request has been approved. Refund of ₹${refund.amount} will be processed within 5-7 business days.`;
    } else if (status === "REJECTED") {
      notificationMessage = `Your return request has been rejected. Reason: ${notes || "Does not meet return policy"}`;
    } else if (status === "COMPLETED") {
      notificationMessage = `Your refund of ₹${refund.amount} has been completed. Check your bank account.`;
    }

    if (notificationMessage) {
      await prisma.notification.create({
        data: {
          userId: refund.order.userId,
          type: "SYSTEM",
          title: "Return Status Updated",
          message: notificationMessage,
          link: `/dashboard/orders/${refund.orderId}`,
        },
      });
    }

    return successResponse({
      refund,
      message: "Return status updated successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
