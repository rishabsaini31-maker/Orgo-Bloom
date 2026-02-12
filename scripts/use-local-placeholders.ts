import { prisma } from "@/lib/prisma";

async function useLocalPlaceholders() {
  console.log("🖼️  Switching to local placeholder images...");

  // Get all products
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products`);

  for (const product of products) {
    // Use local placeholder that always works
    const localPlaceholder = "/placeholder-product.svg";

    await prisma.product.update({
      where: { id: product.id },
      data: {
        imageUrl: localPlaceholder,
        images: [localPlaceholder],
      },
    });

    console.log(`✅ Updated: ${product.name}`);
  }

  console.log("\n🎉 All products now use local placeholders!");
  console.log("📝 SVG placeholder at /public/placeholder-product.svg");
}

useLocalPlaceholders()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
