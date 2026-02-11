import { NextRequest } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

/**
 * @deprecated This endpoint is deprecated
 * Use Google OAuth login instead at /login
 * Sign in with: POST /api/auth/signin/google
 */
export async function POST(request: NextRequest) {
  try {
    throw new ApiError(
      "Email/password authentication is deprecated. Please use Google OAuth login at /login",
      403,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
