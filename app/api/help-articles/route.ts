import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createArticleSchema = z.object({
  title: z.string().min(5),
  slug: z.string().min(3),
  content: z.string().min(50),
  category: z.enum(["SHIPPING", "PAYMENT", "PRODUCTS", "RETURNS", "GENERAL"]),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = { published: true };
    if (category) {
      where.category = category;
    }

    const [articles, total] = await Promise.all([
      prisma.helpArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          views: true,
          helpful: true,
          notHelpful: true,
        },
        orderBy: { order: "asc" },
        skip,
        take: limit,
      }),
      prisma.helpArticle.count({ where }),
    ]);

    return successResponse({
      articles,
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

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const body = await request.json();
    const { title, slug, content, category } = createArticleSchema.parse(body);

    // Check if slug already exists
    const existing = await prisma.helpArticle.findUnique({ where: { slug } });
    if (existing) {
      throw new ApiError("Article with this slug already exists", 400);
    }

    const article = await prisma.helpArticle.create({
      data: {
        title,
        slug,
        content,
        category,
      },
    });

    return successResponse({ article }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
