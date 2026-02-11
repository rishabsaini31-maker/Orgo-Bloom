import { NextRequest } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

/**
 * @deprecated This endpoint is deprecated
 * Password changes are not supported with OAuth authentication
 * Users must reset their password through Google account settings
 */
export async function POST(request: NextRequest) {
  try {
    throw new ApiError(
      "Password management is not supported with Google OAuth authentication",
      403,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
