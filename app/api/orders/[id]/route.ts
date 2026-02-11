import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Users can only view their own orders unless they're admin
    if (!isAdmin(user) && order.userId !== user.userId) {
      throw new ApiError("Forbidden", 403);
    }

    return successResponse({ order });
  } catch (error) {
    return handleApiError(error);
  }
}

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
    const { status, trackingNumber, notes } = body;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order
      const updated = await tx.order.update({
        where: { id: params.id },
        data: {
          ...(status && { status }),
          ...(trackingNumber && { trackingNumber }),
          ...(notes !== undefined && { notes }),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payment: true,
        },
      });

      // Add status history if status changed
      if (status && status !== order.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status,
            notes: notes || `Status updated to ${status}`,
            createdBy: user.userId,
          },
        });

        // Create notification for customer
        await tx.notification.create({
          data: {
            userId: order.userId,
            title: "Order Status Updated",
            message: `Your order #${order.orderNumber} is now ${status}.`,
            type: "ORDER",
            link: `/dashboard`,
          },
        });

        // Send email notification (async, don't wait)
        Promise.resolve()
          .then(async () => {
            const { sendEmail, generateOrderStatusEmail } =
              await import("@/lib/email");
            await sendEmail({
              to: order.user.email,
              subject: `Order Update - ${order.orderNumber}`,
              html: generateOrderStatusEmail(
                order.user.name,
                order.orderNumber,
                status,
                trackingNumber,
              ),
            });
          })
          .catch((error) => {
            console.error("Failed to send order status email:", error);
          });
      }

      return updated;
    });

    return successResponse({ order: updatedOrder });
  } catch (error) {
    return handleApiError(error);
  }
}
