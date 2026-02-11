import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateArticleSchema = z.object({
  title: z.string().min(5).optional(),
  content: z.string().min(50).optional(),
  category: z
    .enum(["SHIPPING", "PAYMENT", "PRODUCTS", "RETURNS", "GENERAL"])
    .optional(),
  published: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const article = await prisma.helpArticle.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        category: true,
        views: true,
        helpful: true,
        notHelpful: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!article) {
      throw new ApiError("Article not found", 404);
    }

    // Increment views
    await prisma.helpArticle.update({
      where: { slug: params.slug },
      data: { views: { increment: 1 } },
    });

    return successResponse({ article });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const article = await prisma.helpArticle.findUnique({
      where: { slug: params.slug },
    });

    if (!article) {
      throw new ApiError("Article not found", 404);
    }

    const body = await request.json();
    const updates = updateArticleSchema.parse(body);

    const updated = await prisma.helpArticle.update({
      where: { slug: params.slug },
      data: updates,
    });

    return successResponse({ article: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const article = await prisma.helpArticle.findUnique({
      where: { slug: params.slug },
    });

    if (!article) {
      throw new ApiError("Article not found", 404);
    }

    await prisma.helpArticle.delete({
      where: { slug: params.slug },
    });

    return successResponse({ message: "Article deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
