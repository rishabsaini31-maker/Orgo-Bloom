import { NextRequest } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

/**
 * @deprecated This endpoint is deprecated
 * Password resets are not supported with OAuth authentication
 * Users can reset their Google account password through Google's account settings
 */
export async function POST(request: NextRequest) {
  try {
    throw new ApiError(
      "Password reset is not supported with Google OAuth authentication",
      403,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
