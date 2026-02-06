import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug, isActive: true },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    return successResponse({ product });
  } catch (error) {
    return handleApiError(error);
  }
}
