import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { addressSchema } from "@/lib/validations";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return successResponse({ addresses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // If this address is set as default, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...validatedData,
        userId: user.userId,
      },
    });

    return successResponse({ address }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
