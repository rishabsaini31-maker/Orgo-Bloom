import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const videoUrlSetting = await prisma.settings.findUnique({
      where: { key: "home_video_url" },
    });

    return NextResponse.json({
      videoUrl:
        videoUrlSetting?.value || "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
  } catch (error) {
    console.error("Error fetching video URL:", error);
    return NextResponse.json(
      { videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { status: 200 },
    );
  }
}
