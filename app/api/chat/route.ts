import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, email, name } = sendMessageSchema.parse(body);

    const user = await authenticateRequest(request);

    // Generate session ID if not provided
    const sessionId = crypto.randomBytes(16).toString("hex");

    const chatMessage = await prisma.chatMessage.create({
      data: {
        message,
        type: "USER",
        sessionId,
        userId: user?.userId || undefined,
        email: email || user?.email || undefined,
        name: name || undefined,
      },
    });

    return successResponse(chatMessage, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      throw new ApiError("Session ID is required", 400);
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        message: true,
        type: true,
        createdAt: true,
        user: {
          select: { name: true },
        },
      },
    });

    return successResponse({ sessionId, messages });
  } catch (error) {
    return handleApiError(error);
  }
}
