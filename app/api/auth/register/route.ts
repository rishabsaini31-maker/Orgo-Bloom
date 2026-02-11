import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import z from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type RegisterRequest = z.infer<typeof registerSchema>;

/**
 * POST /api/auth/register
 * Register a new user with email and password
 *
 * Supports both email/password and Google OAuth registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validated = registerSchema.parse(body);
    const { email, password, name } = validated;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError("An account with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        provider: "email",
        providerAccountId: null,
        emailVerified: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. You can now sign in.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
