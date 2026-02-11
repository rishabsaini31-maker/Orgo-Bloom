import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return successResponse({ received: true }, 400);
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(JSON.stringify(body))
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return successResponse({ received: true }, 400);
    }

    const event = body.event;
    const payload = body.payload.payment.entity;

    console.log("Razorpay Webhook Event:", event);

    // Handle different webhook events
    switch (event) {
      case "payment.captured": {
        const payment = await prisma.payment.findFirst({
          where: { razorpayPaymentId: payload.id },
          include: {
            order: {
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
                user: true,
              },
            },
          },
        });

        if (payment && payment.status === "PENDING") {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: "COMPLETED",
                method: payload.method,
              },
            });

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: "COMPLETED",
                status: "PROCESSING",
              },
            });

            // Add order status history
            await tx.orderStatusHistory.create({
              data: {
                orderId: payment.orderId,
                status: "PROCESSING",
                notes: "Payment completed successfully",
              },
            });

            // Create notification
            await tx.notification.create({
              data: {
                userId: payment.order.userId,
                title: "Payment Confirmed",
                message: `Payment for order #${payment.order.orderNumber} has been confirmed.`,
                type: "PAYMENT",
                link: `/dashboard`,
              },
            });
          });

          // Send order confirmation email (async)
          Promise.resolve()
            .then(async () => {
              const { sendEmail, generateOrderConfirmationEmail } =
                await import("@/lib/email");
              await sendEmail({
                to: payment.order.user.email,
                subject: `Order Confirmation - ${payment.order.orderNumber}`,
                html: generateOrderConfirmationEmail(
                  payment.order.user.name || "Customer",
                  payment.order.orderNumber,
                  payment.order.total,
                  payment.order.items,
                ),
              });
            })
            .catch((error) => {
              console.error("Failed to send order confirmation email:", error);
            });

          console.log(`Payment captured for order: ${payment.orderId}`);
        }
        break;
      }

      case "payment.failed": {
        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId: payload.order_id },
          include: {
            order: true,
          },
        });

        if (payment) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: "FAILED",
                razorpayPaymentId: payload.id,
              },
            });

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: "FAILED",
              },
            });

            // Create notification
            await tx.notification.create({
              data: {
                userId: payment.order.userId,
                title: "Payment Failed",
                message: `Payment for order #${payment.order.orderNumber} failed. Please try again.`,
                type: "PAYMENT",
                link: `/dashboard`,
              },
            });
          });

          console.log(`Payment failed for order: ${payment.orderId}`);
        }
        break;
      }

      default:
        console.log("Unhandled webhook event:", event);
    }

    return successResponse({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return handleApiError(error);
  }
}
