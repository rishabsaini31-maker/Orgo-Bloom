import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get recently viewed products (last 20)
    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId: user.userId },
      orderBy: { viewedAt: "desc" },
      take: 20,
      select: {
        productId: true,
        viewedAt: true,
      },
    });

    // Get product details
    const productIds = recentlyViewed.map((rv) => rv.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    // Merge data
    const result = recentlyViewed
      .map((rv) => {
        const product = products.find((p) => p.id === rv.productId);
        if (!product) return null;
        return {
          ...product,
          viewedAt: rv.viewedAt,
        };
      })
      .filter(Boolean);

    return successResponse({ products: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      throw new ApiError("Product ID is required", 400);
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    // Upsert recently viewed (update viewedAt if exists, create if not)
    await prisma.recentlyViewed.upsert({
      where: {
        userId_productId: {
          userId: user.userId,
          productId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: user.userId,
        productId,
      },
    });

    return successResponse({ message: "Product view recorded" });
  } catch (error) {
    return handleApiError(error);
  }
}
