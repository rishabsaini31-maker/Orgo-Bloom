import { prisma } from "@/lib/prisma";

async function restoreActualImages() {
  console.log("🔧 Restoring actual uploaded images...\n");

  // Get products that have images in the array but placeholder in imageUrl
  const products = await prisma.product.findMany();

  for (const product of products) {
    // If product has images array with actual uploads, use the first one as imageUrl
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];

      // Skip if it's already a real uploaded image or if it's the placeholder
      if (
        firstImage !== "/placeholder-product.svg" &&
        (firstImage.includes("/uploads/") ||
          firstImage.includes("blob.vercel-storage.com"))
      ) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            imageUrl: firstImage,
          },
        });
        console.log(`✅ Restored: ${product.name}`);
        console.log(`   imageUrl: ${firstImage}\n`);
      } else {
        console.log(`⏭️  Skipped: ${product.name} (no real images)`);
      }
    }
  }

  console.log("\n🎉 Done!");
}

restoreActualImages()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
