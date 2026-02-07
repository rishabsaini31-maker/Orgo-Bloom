import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user || authResult.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get videos array from homepage_videos setting
    const videosSetting = await prisma.settings.findUnique({
      where: { key: "homepage_videos" },
    });

    return NextResponse.json({
      videos: videosSetting?.videos || [],
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
    const { videos } = body;

    if (!Array.isArray(videos)) {
      return NextResponse.json(
        { error: "Videos must be an array" },
        { status: 400 },
      );
    }

    // Upsert videos array in homepage_videos setting
    await prisma.settings.upsert({
      where: { key: "homepage_videos" },
      update: { videos: videos },
      create: {
        key: "homepage_videos",
        videos: videos,
        value: "", // Required by schema but not used for videos
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      videos,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
