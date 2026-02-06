import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError("Missing payment details", 400);
    }

    // Verify signature
    const sign = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw new ApiError("Invalid payment signature", 400);
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { order: true },
    });

    if (!payment) {
      throw new ApiError("Payment record not found", 404);
    }

    if (payment.order.userId !== user.userId) {
      throw new ApiError("Forbidden", 403);
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: "COMPLETED",
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "COMPLETED",
        status: "PROCESSING",
      },
    });

    // Update product stock
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: payment.orderId },
    });

    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return successResponse({
      message: "Payment verified successfully",
      orderId: payment.orderId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
