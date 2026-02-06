import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user || authResult.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get video URL setting
    const videoUrlSetting = await prisma.settings.findUnique({
      where: { key: "home_video_url" },
    });

    return NextResponse.json({
      videoUrl: videoUrlSetting?.value || "",
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user || authResult.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoUrl } = body;

    // Upsert video URL setting
    await prisma.settings.upsert({
      where: { key: "home_video_url" },
      update: { value: videoUrl || "" },
      create: {
        key: "home_video_url",
        value: videoUrl || "",
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      videoUrl,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
