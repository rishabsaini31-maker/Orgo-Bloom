import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Review must be at least 20 characters"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const body = await request.json();
    const { rating, title, content } = createReviewSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: params.id,
        userId: user.userId,
      },
    });

    if (existingReview) {
      throw new ApiError("You have already reviewed this product", 400);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId: params.id,
        userId: user.userId,
        rating,
        title,
        content,
        verified: true, // Can check order history to verify
        status: "PENDING", // Require moderation by default
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse({ review }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const sort = searchParams.get("sort") || "newest"; // newest, helpful, rating-high, rating-low

    const skip = (page - 1) * limit;

    // Build order clause
    let orderBy: any = { createdAt: "desc" };
    if (sort === "helpful") {
      orderBy = { helpful: "desc" };
    } else if (sort === "rating-high") {
      orderBy = { rating: "desc" };
    } else if (sort === "rating-low") {
      orderBy = { rating: "asc" };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId: params.id,
          status: "APPROVED",
        },
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          helpful: true,
          notHelpful: true,
          createdAt: true,
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: {
          productId: params.id,
          status: "APPROVED",
        },
      }),
    ]);

    // Calculate average rating
    const ratingData = await prisma.review.groupBy({
      by: ["rating"],
      where: {
        productId: params.id,
        status: "APPROVED",
      },
      _count: true,
    });

    const avgRating =
      ratingData.length > 0
        ? ratingData.reduce((sum, r) => sum + r.rating * r._count, 0) /
          ratingData.reduce((sum, r) => sum + r._count, 0)
        : 0;

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingData.forEach((r) => {
      ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5] = r._count;
    });

    return successResponse({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: total,
        ratingDistribution,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
