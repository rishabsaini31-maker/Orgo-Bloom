import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: "homepage_videos" },
    });

    return NextResponse.json({
      videos: setting?.videos || [],
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videos } = await request.json();

    if (!Array.isArray(videos)) {
      return NextResponse.json(
        { error: "Videos must be an array" },
        { status: 400 },
      );
    }

    if (videos.length > 8) {
      return NextResponse.json(
        { error: "Maximum 8 videos allowed" },
        { status: 400 },
      );
    }

    if (videos.length > 0 && videos.length < 3) {
      return NextResponse.json(
        { error: "Minimum 3 videos required" },
        { status: 400 },
      );
    }

    const setting = await prisma.settings.upsert({
      where: { key: "homepage_videos" },
      update: { videos },
      create: {
        key: "homepage_videos",
        value: "[]",
        videos,
      },
    });

    return NextResponse.json({
      success: true,
      videos: setting.videos,
    });
  } catch (error) {
    console.error("Error saving videos:", error);
    return NextResponse.json(
      { error: "Failed to save videos" },
      { status: 500 },
    );
  }
}
