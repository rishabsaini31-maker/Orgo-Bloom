import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reorderSchema = z.object({
  order: z.number(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const body = await request.json();
    const { order } = reorderSchema.parse(body);

    const image = await prisma.productImage.findUnique({
      where: { id: params.imageId },
    });

    if (!image || image.productId !== params.id) {
      throw new ApiError("Image not found", 404);
    }

    const updated = await prisma.productImage.update({
      where: { id: params.imageId },
      data: { order },
    });

    return successResponse({ gallery: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const image = await prisma.productImage.findUnique({
      where: { id: params.imageId },
    });

    if (!image || image.productId !== params.id) {
      throw new ApiError("Image not found", 404);
    }

    await prisma.productImage.delete({
      where: { id: params.imageId },
    });

    return successResponse({ message: "Image deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
