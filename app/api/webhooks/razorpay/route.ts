import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse } from "@/lib/api-utils";

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
        });

        if (payment && payment.status === "PENDING") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              method: payload.method,
            },
          });

          await prisma.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: "COMPLETED",
              status: "PROCESSING",
            },
          });

          console.log(`Payment captured for order: ${payment.orderId}`);
        }
        break;
      }

      case "payment.failed": {
        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId: payload.order_id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              razorpayPaymentId: payload.id,
            },
          });

          await prisma.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: "FAILED",
            },
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
