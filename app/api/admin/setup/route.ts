import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Development-only endpoint to promote current user to admin
 * Only works if ADMIN_SETUP_SECRET matches environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Check for development setup secret
    const setupSecret = request.headers.get("x-setup-secret");
    const envSecret = process.env.ADMIN_SETUP_SECRET;

    if (!envSecret || setupSecret !== envSecret) {
      return NextResponse.json(
        { error: "Invalid or missing setup secret" },
        { status: 401 },
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User promoted to admin successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup admin" },
      { status: 500 },
    );
  }
}

/**
 * Get current user's admin status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      user,
      isAdmin: user?.role === "ADMIN",
    });
  } catch (error) {
    console.error("Check admin status error:", error);
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 },
    );
  }
}
