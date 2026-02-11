import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "related"; // related, bestsellers, trending
    const limit = parseInt(searchParams.get("limit") || "4");

    // Get the current product
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    let recommendations;

    if (type === "related") {
      // Get products from same category (excluding current)
      recommendations = await prisma.product.findMany({
        where: {
          category: product.category,
          id: { not: params.id },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          stock: true,
        },
        take: limit,
      });
    } else if (type === "bestsellers") {
      // Get most ordered products
      recommendations = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { not: params.id },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          stock: true,
          _count: {
            select: { orderItems: true },
          },
        },
        orderBy: {
          orderItems: {
            _count: "desc",
          },
        },
        take: limit,
      });
    } else if (type === "trending") {
      // Get recently viewed products or featured items
      recommendations = await prisma.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
          id: { not: params.id },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          stock: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    return successResponse({ type, recommendations });
  } catch (error) {
    return handleApiError(error);
  }
}
