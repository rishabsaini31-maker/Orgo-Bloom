import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { addressSchema } from "@/lib/validations";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const address = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!address) {
      throw new ApiError("Address not found", 404);
    }

    return successResponse({ address });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!existingAddress) {
      throw new ApiError("Address not found", 404);
    }

    // If setting as default, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.userId,
          isDefault: true,
          id: { not: params.id },
        },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: params.id },
      data: validatedData,
    });

    return successResponse({
      message: "Address updated successfully",
      address: updatedAddress,
    });
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

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!address) {
      throw new ApiError("Address not found", 404);
    }

    await prisma.address.delete({
      where: { id: params.id },
    });

    return successResponse({
      message: "Address deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
