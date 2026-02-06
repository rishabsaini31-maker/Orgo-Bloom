import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { updateProductSchema } from "@/lib/validations";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    return successResponse({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      throw new ApiError("Product not found", 404);
    }

    // Check slug uniqueness if updating slug
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugExists) {
        throw new ApiError("Product with this slug already exists", 400);
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: validatedData,
    });

    return successResponse({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return successResponse({ message: "Product deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
