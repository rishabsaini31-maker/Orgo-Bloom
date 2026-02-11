import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const approveReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      throw new ApiError("Review not found", 404);
    }

    const body = await request.json();
    const { action } = approveReviewSchema.parse(body);

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      },
      include: {
        product: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return successResponse({
      review: updated,
      message: `Review ${action.toLowerCase()}d`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
