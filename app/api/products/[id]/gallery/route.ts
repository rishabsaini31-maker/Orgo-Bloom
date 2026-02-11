import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addImageSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
  alt: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const gallery = await prisma.productImage.findMany({
      where: { productId: params.id },
      orderBy: { order: "asc" },
      select: {
        id: true,
        imageUrl: true,
        alt: true,
        order: true,
      },
    });

    return successResponse({ gallery });
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
    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const body = await request.json();
    const { imageUrl, alt } = addImageSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    // Get max order
    const maxImage = await prisma.productImage.findFirst({
      where: { productId: params.id },
      orderBy: { order: "desc" },
    });

    const newImage = await prisma.productImage.create({
      data: {
        productId: params.id,
        imageUrl,
        alt,
        order: (maxImage?.order || 0) + 1,
      },
    });

    return successResponse({ image: newImage }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
