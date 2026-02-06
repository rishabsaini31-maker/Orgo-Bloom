import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { generateOrderNumber, calculateShipping } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { items, shippingAddressId } = body;

    if (!items || items.length === 0) {
      throw new ApiError("Cart is empty", 400);
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId: user.userId,
      },
    });

    if (!address) {
      throw new ApiError("Invalid shipping address", 400);
    }

    // Verify products and calculate total
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new ApiError(`Product ${item.productId} not found`, 404);
      }

      if (!product.isActive) {
        throw new ApiError(`Product ${product.name} is not available`, 400);
      }

      if (product.stock < item.quantity) {
        throw new ApiError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          400,
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        weight: item.weight || product.weight,
      });
    }

    const shippingCost = calculateShipping(subtotal);
    const tax = 0; // Tax calculation can be added based on requirements
    const total = subtotal + shippingCost + tax;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.userId,
        subtotal,
        shippingCost,
        tax,
        total,
        status: "PENDING",
        paymentStatus: "PENDING",
        shippingAddress: address,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return successResponse({ order }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = { userId: user.userId };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return successResponse({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
