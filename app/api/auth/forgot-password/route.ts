import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { createPasswordResetToken } from "@/lib/token";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import {
  checkRateLimit,
  rateLimitConfigs,
  getRateLimitHeaders,
} from "@/lib/rate-limit";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = checkRateLimit(
      `forgot-password:${clientIp}`,
      rateLimitConfigs.strict,
    );

    if (!rateLimit.allowed) {
      const headers = getRateLimitHeaders(rateLimit);
      return successResponse(
        { error: "Too many requests. Please try again later." },
        429,
        headers,
      );
    }

    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse({
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = await createPasswordResetToken(user.id);

    // Send email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Password Reset Request - Orgobloom",
      html: generatePasswordResetEmail(user.name, resetLink),
    });

    if (!emailSent) {
      console.error("Failed to send password reset email");
      // Don't throw error to user, just log it
    }

    return successResponse(
      {
        message:
          "If an account exists with this email, you will receive a password reset link.",
      },
      200,
      getRateLimitHeaders(rateLimit),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
