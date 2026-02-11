import { NextRequest } from "next/server";
import { authenticateRequest, invalidateAllUserSessions } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Invalidate all sessions for this user
    await invalidateAllUserSessions(user.userId);

    return successResponse({
      message: "Successfully logged out from all devices",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
