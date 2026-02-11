import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      throw new ApiError("Unauthorized", 401);
    }

    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!profile) {
      throw new ApiError("User not found", 404);
    }

    return successResponse({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        role: true,
        emailVerified: true,
      },
    });

    return successResponse({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
