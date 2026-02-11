import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const approveReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { status },
        select: {
          id: true,
          title: true,
          content: true,
          rating: true,
          status: true,
          createdAt: true,
          product: { select: { name: true, id: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { status } }),
    ]);

    return successResponse({
      reviews,
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
