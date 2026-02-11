import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Restoring video data...");

  // Video URLs/paths - these should match your actual video files
  const videos = [
    "/videos/uhd-4k-seamless-animation.mp4",
    "/videos/close-up-hands-mixing-organic-fertilizer.mp4",
    "/videos/seamless-animation-organic.mp4",
  ];

  try {
    // Update or create homepage_videos setting
    const videoSetting = await prisma.settings.upsert({
      where: { key: "homepage_videos" },
      update: {
        videos: videos,
      },
      create: {
        key: "homepage_videos",
        value: JSON.stringify(videos),
        videos: videos,
      },
    });

    console.log("✅ Videos restored successfully!");
    console.log(`Videos count: ${videoSetting.videos.length}`);
    console.log("Videos:", videoSetting.videos);
  } catch (error) {
    console.error("❌ Error restoring videos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
