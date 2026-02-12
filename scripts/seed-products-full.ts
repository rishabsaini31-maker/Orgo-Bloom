import { prisma } from "@/lib/prisma";

async function seedProducts() {
  console.log("🌱 Seeding products...");

  const products = [
    // ============= COW MANURE PRODUCTS =============
    {
      name: "Premium Cow Manure - 5 kg",
      slug: "premium-cow-manure-5kg",
      description:
        "Premium composted cow manure fertilizer for all plants. 100% organic, nutrient-rich, and chemical-free.",
      price: 299,
      weight: "5 kg",
      stock: 50,
      imageUrl:
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=500&h=500&fit=crop",
      ],
      category: "cow",
      isActive: true,
      isFeatured: true,
      benefits: [
        "Enriches soil with N, P, K nutrients",
        "Improves soil structure and water retention",
        "Promotes healthy plant growth",
        "Long-lasting and cost-effective",
      ],
      usage:
        "For gardens: 2-3 kg per m² mixed into soil. For pots: 1 part manure with 4 parts soil. For lawns: 1-2 kg per 10 m².",
      composition:
        "Nitrogen 2-3%, Phosphorus 1-2%, Potassium 1-2%, Organic Matter 20-30%, Beneficial Microbes",
    },
    {
      name: "Cow Manure Compost - 10 kg",
      slug: "cow-manure-compost-10kg",
      description:
        "Aged and composted cow manure perfect for vegetable gardens and fruit trees. Rich in nutrients and microbes.",
      price: 499,
      weight: "10 kg",
      stock: 35,
      imageUrl:
        "https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&h=500&fit=crop",
      ],
      category: "cow",
      isActive: true,
      isFeatured: true,
      benefits: [
        "Ideal for vegetable gardens",
        "Enhances soil fertility over time",
        "Reduces chemical fertilizer dependency",
        "Environmentally sustainable",
      ],
      usage:
        "Mix into soil at planting time. Apply 2-3 weeks before planting. Ideal for raised beds and container gardening.",
      composition:
        "Nitrogen 2-3%, Phosphorus 1.5-2.5%, Potassium 1-2%, Calcium 1-2%, Magnesium 0.5-1%",
    },
    {
      name: "Bulk Cow Manure - 25 kg",
      slug: "bulk-cow-manure-25kg",
      description:
        "Large quantity cow manure for commercial farming and large gardens. Best value for volume buyers.",
      price: 1899,
      weight: "25 kg",
      stock: 20,
      imageUrl:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop",
      ],
      category: "cow",
      isActive: true,
      isFeatured: false,
      benefits: [
        "Best value for large applications",
        "Perfect for commercial farming",
        "Bulk pricing advantage",
        "Professional-grade quality",
      ],
      usage:
        "Apply 3-5 kg per tree. Suitable for large agricultural applications. Excellent for permanent plantings.",
      composition:
        "Well-balanced nutrients: N 2-3%, P 1-2%, K 1-2%, OM 25%, Beneficial Bacteria & Fungi",
    },

    // ============= CHICKEN MANURE PRODUCTS =============
    {
      name: "Chicken Manure Pellets - 5 kg",
      slug: "chicken-manure-pellets-5kg",
      description:
        "Processed chicken manure pellets. High nitrogen content, excellent for flowering plants and vegetables.",
      price: 349,
      weight: "5 kg",
      stock: 45,
      imageUrl:
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=500&h=500&fit=crop",
      ],
      category: "chicken",
      isActive: true,
      isFeatured: true,
      benefits: [
        "High nitrogen content for lush growth",
        "Processed into convenient pellets",
        "Quick nutrient availability",
        "Odor-minimized formula",
      ],
      usage:
        "Sprinkle around plants: 1-2 kg per 10 m². Water after application. Use every 4-6 weeks during growing season.",
      composition:
        "Nitrogen 4-5%, Phosphorus 3-4%, Potassium 2-3%, Organic Matter 25-35%, Processed & Odor-Reduced",
    },
    {
      name: "Chicken Manure Compost - 10 kg",
      slug: "chicken-manure-compost-10kg",
      description:
        "Fully composted chicken manure with aged maturity. Excellent for flower beds and decorative plants.",
      price: 549,
      weight: "10 kg",
      stock: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=500&h=500&fit=crop",
      ],
      category: "chicken",
      isActive: true,
      isFeatured: true,
      benefits: [
        "Enhanced flowering and fruiting",
        "Fully decomposed for safety",
        "Concentrated nutrients",
        "No burn risk to plants",
      ],
      usage:
        "Mix into garden beds before planting (1 part compost to 3 parts soil). Top dress around established plants with 5-10 cm layer.",
      composition:
        "Nitrogen 3-4%, Phosphorus 2.5-3.5%, Potassium 1.5-2.5%, OM 30-40%, Stable pH 6.5-7.5",
    },
    {
      name: "Premium Chicken Manure Mix - 15 kg",
      slug: "premium-chicken-manure-mix-15kg",
      description:
        "Blended chicken manure with additional ingredients. Enhanced formula for maximum nutrient absorption.",
      price: 799,
      weight: "15 kg",
      stock: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop",
      ],
      category: "chicken",
      isActive: true,
      isFeatured: false,
      benefits: [
        "Enhanced nutrient formula",
        "Better absorption rate",
        "Premium quality blend",
        "Suitable for all plant types",
      ],
      usage:
        "Apply 1-2 kg per 10 m² for best results. Mix into soil or use as top dressing. Ideal for high-yield gardens.",
      composition:
        "Nitrogen 3.5-4.5%, Phosphorus 3-4%, Potassium 2-3%, OM 35%, Beneficial Microbes, Biochar",
    },
  ];

  try {
    for (const product of products) {
      // Check if product already exists
      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
      });

      if (existing) {
        console.log(`⏭️  Skipping "${product.name}" (already exists)`);
        continue;
      }

      const created = await prisma.product.create({
        data: product,
      });

      console.log(`✅ Created: ${created.name}`);
    }

    console.log("\n🎉 All products seeded successfully!");

    // Show summary
    const cowCount = await prisma.product.count({
      where: { category: "cow" },
    });
    const chickenCount = await prisma.product.count({
      where: { category: "chicken" },
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Cow Manure Products: ${cowCount}`);
    console.log(`   Chicken Manure Products: ${chickenCount}`);
    console.log(`   Total Products: ${cowCount + chickenCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
}

seedProducts();
