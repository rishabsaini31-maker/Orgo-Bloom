import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { sendEmail, generateShippingNotificationEmail } from "@/lib/email";

/**
 * POST - Send shipping notification (admin only)
 * Call this when order status changes to SHIPPED
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== "ADMIN") {
      throw new ApiError("Admin access required", 403);
    }

    const body = await request.json();
    const { orderId, trackingNumber, courierName, estimatedDelivery } = body;

    if (!orderId || !trackingNumber) {
      throw new ApiError("Missing orderId or trackingNumber", 400);
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Update order with tracking info
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        status: "SHIPPED",
      },
    });

    // Send shipping notification email
    try {
      const emailHtml = generateShippingNotificationEmail(
        order.user.name || "Customer",
        order.orderNumber,
        trackingNumber,
        estimatedDelivery || "5-7 business days",
        courierName,
      );

      await sendEmail({
        to: order.user.email,
        subject: `Your Order #${order.orderNumber} is on its way!`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send shipping notification:", emailError);
    }

    // Create notification in system
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "SYSTEM",
        title: "Order Shipped",
        message: `Your order #${order.orderNumber} has been shipped! Tracking number: ${trackingNumber}`,
        link: `/dashboard/orders/${orderId}`,
      },
    });

    return successResponse({
      order: updatedOrder,
      message: "Shipping notification sent successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
