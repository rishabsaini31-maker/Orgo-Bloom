import { prisma } from "@/lib/prisma";

async function fixProductImages() {
  console.log("🖼️  Fixing product images...");

  // Get all products
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products`);

  for (const product of products) {
    // Use reliable placeholder images instead of broken Unsplash URLs
    const placeholderUrl = `https://placehold.co/500x500/4ade80/ffffff?text=${encodeURIComponent(product.name.substring(0, 20))}`;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        imageUrl: placeholderUrl,
        images: [placeholderUrl],
      },
    });

    console.log(`✅ Updated: ${product.name}`);
  }

  console.log("\n🎉 All product images fixed!");
}

fixProductImages()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
