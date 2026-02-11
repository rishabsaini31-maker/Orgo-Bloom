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
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        stock: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    const isInStock = product.stock > 0;
    const status = isInStock ? "IN_STOCK" : "OUT_OF_STOCK";

    return successResponse({
      id: product.id,
      name: product.name,
      stock: product.stock,
      status,
      isInStock,
      lastUpdated: product.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    // Check if user already has alert
    const existingAlert = await prisma.backInStockAlert.findUnique({
      where: {
        productId_userId: {
          productId: params.id,
          userId: user.userId,
        },
      },
    });

    if (existingAlert) {
      throw new ApiError("You already have an alert for this product", 400);
    }

    // Create alert
    const alert = await prisma.backInStockAlert.create({
      data: {
        productId: params.id,
        userId: user.userId,
      },
    });

    return successResponse({ alert }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
