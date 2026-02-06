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
    });

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    const updatedOrder = await prisma.order.update({
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

    return successResponse({ order: updatedOrder });
  } catch (error) {
    return handleApiError(error);
  }
}
