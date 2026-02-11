import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { verifyEmailVerificationToken } from "@/lib/token";
import { z } from "zod";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyEmailSchema.parse(body);

    // Verify token
    const userId = await verifyEmailVerificationToken(validatedData.token);

    if (!userId) {
      throw new ApiError("Invalid or expired verification token", 400);
    }

    return successResponse({
      message: "Email verified successfully!",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Resend verification email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      throw new ApiError("Email is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    if (user.emailVerified) {
      throw new ApiError("Email already verified", 400);
    }

    // Generate and send new verification token
    const { createEmailVerificationToken } = await import("@/lib/token");
    const { sendEmail, generateVerificationEmail } =
      await import("@/lib/email");

    const token = await createEmailVerificationToken(user.id);
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - Orgobloom",
      html: generateVerificationEmail(user.name, verificationLink),
    });

    return successResponse({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
