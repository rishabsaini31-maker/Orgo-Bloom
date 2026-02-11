import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get order status history
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: "asc" },
    });

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

    return successResponse({ history });
  } catch (error) {
    return handleApiError(error);
  }
}
