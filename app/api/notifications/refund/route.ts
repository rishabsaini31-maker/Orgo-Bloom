import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { sendEmail, generateRefundConfirmationEmail } from "@/lib/email";

/**
 * POST - Send refund confirmation notification (admin only)
 * Call this when refund status changes
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== "ADMIN") {
      throw new ApiError("Admin access required", 403);
    }

    const body = await request.json();
    const { refundId } = body;

    if (!refundId) {
      throw new ApiError("Missing refundId", 400);
    }

    // Get refund details with order info
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        order: {
          include: {
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (!refund) {
      throw new ApiError("Refund not found", 404);
    }

    // Send refund confirmation email
    try {
      const emailHtml = generateRefundConfirmationEmail(
        refund.order.user.name || "Customer",
        refund.order.orderNumber,
        refund.amount,
        refund.reason || "Product return",
        refund.status,
      );

      const statusMessage = {
        APPROVED: "refund has been approved",
        REJECTED: "return request has been rejected",
        COMPLETED: "refund has been processed",
        PENDING: "your return is being reviewed",
      };

      await sendEmail({
        to: refund.order.user.email,
        subject: `Refund Status Update - Order #${refund.order.orderNumber}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send refund confirmation:", emailError);
    }

    // Create notification in system
    const messageMap: Record<string, string> = {
      APPROVED: `Your refund of ₹${refund.amount} has been approved! You'll receive it within 5-7 business days.`,
      REJECTED: `Your return request for order #${refund.order.orderNumber} does not meet our return policy.`,
      COMPLETED: `Your refund of ₹${refund.amount} has been processed and transferred to your account.`,
      PENDING: `Your return request is being reviewed. We'll update you soon.`,
    };

    await prisma.notification.create({
      data: {
        userId: refund.order.userId,
        type: "SYSTEM",
        title:
          refund.status === "COMPLETED"
            ? "Refund Completed"
            : refund.status === "APPROVED"
              ? "Refund Approved"
              : refund.status === "REJECTED"
                ? "Return Rejected"
                : "Refund Update",
        message: messageMap[refund.status] || "Refund status updated",
        link: `/dashboard/orders/${refund.orderId}`,
      },
    });

    return successResponse({
      refund,
      message: "Refund notification sent successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
