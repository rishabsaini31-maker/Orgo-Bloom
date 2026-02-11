import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const helpfulSchema = z.object({
  helpful: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } },
) {
  try {
    const body = await request.json();
    const { helpful } = helpfulSchema.parse(body);

    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
    });

    if (!review) {
      throw new ApiError("Review not found", 404);
    }

    const updated = await prisma.review.update({
      where: { id: params.reviewId },
      data: {
        helpful: helpful ? review.helpful + 1 : review.helpful,
        notHelpful: !helpful ? review.notHelpful + 1 : review.notHelpful,
      },
    });

    return successResponse({ review: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
