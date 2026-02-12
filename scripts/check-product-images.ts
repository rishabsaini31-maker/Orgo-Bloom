import { prisma } from "@/lib/prisma";

async function checkProductImages() {
  console.log("🔍 Checking product images in database...\n");

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
      images: true,
    },
  });

  console.log(`Found ${products.length} products:\n`);

  for (const product of products) {
    console.log(`📦 ${product.name}`);
    console.log(`   imageUrl: ${product.imageUrl || "❌ NULL"}`);
    console.log(`   images: ${JSON.stringify(product.images) || "❌ EMPTY"}`);
    console.log("");
  }
}

checkProductImages()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
