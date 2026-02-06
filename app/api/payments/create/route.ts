import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import razorpay from "@/lib/razorpay";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      throw new ApiError("Order ID is required", 400);
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    if (order.userId !== user.userId) {
      throw new ApiError("Forbidden", 403);
    }

    if (order.paymentStatus === "COMPLETED") {
      throw new ApiError("Order already paid", 400);
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // Amount in paise
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        userId: user.userId,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
        currency: "INR",
        status: "PENDING",
        email: order.user.email,
        contact: order.user.phone || undefined,
      },
    });

    return successResponse({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
