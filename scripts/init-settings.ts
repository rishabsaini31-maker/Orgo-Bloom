import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing default settings...");

  // Set default video URL
  await prisma.settings.upsert({
    where: { key: "home_video_url" },
    update: {},
    create: {
      key: "home_video_url",
      value: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
  });

  console.log("✅ Default settings initialized!");
}

main()
  .catch((e) => {
    console.error("Error initializing settings:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
