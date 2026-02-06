import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting to seed products...");

  const products = [
    // Cow Manure Products
    {
      name: "Premium Cow Manure Compost",
      slug: "premium-cow-manure-compost",
      description:
        "Rich organic fertilizer perfect for all plants. Enhances soil fertility and promotes healthy growth. Made from 100% natural cow manure with no chemical additives.",
      price: 499,
      weight: "5kg",
      imageUrl:
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&h=500&fit=crop",
      stock: 100,
      category: "cow",
      isFeatured: true,
      benefits: [
        "100% organic",
        "Improves soil fertility",
        "Rich in nutrients",
      ],
      usage:
        "Apply 2-3 kg per square meter. Mix well with soil before planting.",
    },
    {
      name: "Organic Vermicompost",
      slug: "organic-vermicompost",
      description:
        "Nutrient-rich earthworm castings for superior plant nutrition. Improves soil structure and water retention. Perfect for vegetable gardens.",
      price: 599,
      weight: "5kg",
      imageUrl:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=500&fit=crop",
      stock: 85,
      category: "cow",
      isFeatured: true,
      benefits: [
        "Rich in microorganisms",
        "Improves water retention",
        "Boosts plant growth",
      ],
      usage: "Mix 1-2 kg with potting soil or apply as top dressing.",
    },
    {
      name: "Garden Nutrient Mix",
      slug: "garden-nutrient-mix",
      description:
        "Complete organic fertilizer blend for vegetables and flowers. Boosts growth and yields naturally. Rich in essential nutrients.",
      price: 699,
      weight: "10kg",
      imageUrl:
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500&h=500&fit=crop",
      stock: 120,
      category: "cow",
      isFeatured: true,
      benefits: [
        "Complete nutrient blend",
        "For all plant types",
        "Increases yield",
      ],
      usage: "Apply 3-4 kg per square meter every 2-3 months.",
    },
    {
      name: "Soil Enrichment Formula",
      slug: "soil-enrichment-formula",
      description:
        "Advanced organic formula to restore soil health. Perfect for depleted garden beds. Improves soil structure and microbial activity.",
      price: 799,
      weight: "10kg",
      imageUrl:
        "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=500&h=500&fit=crop",
      stock: 95,
      category: "cow",
      isFeatured: true,
      benefits: [
        "Restores soil health",
        "Improves soil structure",
        "Enhances microbial activity",
      ],
      usage: "Apply 4-5 kg per square meter and work into soil thoroughly.",
    },
    {
      name: "Plant Growth Booster",
      slug: "plant-growth-booster",
      description:
        "Concentrated organic nutrients for faster plant growth. Ideal for seedlings and young plants. Promotes strong root development.",
      price: 549,
      weight: "2kg",
      imageUrl:
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&h=500&fit=crop",
      stock: 110,
      category: "cow",
      isFeatured: true,
      benefits: ["Concentrated formula", "Fast-acting", "Promotes root growth"],
      usage: "Mix 200g per plant. Apply weekly during growing season.",
    },
    {
      name: "Organic Garden Starter Kit",
      slug: "organic-garden-starter-kit",
      description:
        "Complete kit with premium compost and fertilizers. Everything you need to start your organic garden. Great value package.",
      price: 899,
      weight: "15kg",
      imageUrl:
        "https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=500&h=500&fit=crop",
      stock: 75,
      category: "cow",
      isFeatured: true,
      benefits: [
        "Complete starter package",
        "Great value",
        "Perfect for beginners",
      ],
      usage: "Use components as directed on individual product instructions.",
    },
    // Chicken Manure Products
    {
      name: "Pure Chicken Manure Pellets",
      slug: "pure-chicken-manure-pellets",
      description:
        "High-nutrient organic chicken manure in convenient pellet form. Perfect for all vegetables and flowers. More concentrated than cow manure.",
      price: 449,
      weight: "5kg",
      imageUrl:
        "https://images.unsplash.com/photo-1623246123429-639ba92d1eca?w=500&h=500&fit=crop",
      stock: 140,
      category: "chicken",
      isFeatured: true,
      benefits: [
        "High nitrogen content",
        "Convenient pellets",
        "Quick nutrient release",
      ],
      usage:
        "Apply 1-2 kg per square meter. Water thoroughly after application.",
    },
    {
      name: "Organic Chicken Droppings Mix",
      slug: "organic-chicken-droppings-mix",
      description:
        "Blended chicken manure with compost for balanced nutrition. Excellent for flower beds and vegetable gardens.",
      price: 549,
      weight: "10kg",
      imageUrl:
        "https://images.unsplash.com/photo-1585249612694-b983a3a86b17?w=500&h=500&fit=crop",
      stock: 105,
      category: "chicken",
      isFeatured: true,
      benefits: ["Balanced NPK ratio", "Easy to apply", "Great for flowers"],
      usage: "Mix 2-3 kg per square meter, water after application.",
    },
    {
      name: "Chicken Manure Compost Premium",
      slug: "chicken-manure-compost-premium",
      description:
        "Aged and composted chicken manure for maximum nutrient availability. Safe for all plant types including seedlings.",
      price: 699,
      weight: "15kg",
      imageUrl:
        "https://images.unsplash.com/photo-1577968607676-4c0fd0ed81f3?w=500&h=500&fit=crop",
      stock: 85,
      category: "chicken",
      isFeatured: false,
      benefits: [
        "Fully composted",
        "Safe for seedlings",
        "High nutrient density",
      ],
      usage: "Apply 3-4 kg per square meter every 4-6 weeks.",
    },
  ];

  for (const product of products) {
    const existingProduct = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (existingProduct) {
      console.log(`Product ${product.name} already exists, skipping...`);
      continue;
    }

    await prisma.product.create({
      data: product,
    });

    console.log(`Created product: ${product.name}`);
  }

  console.log("✅ Products seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding products:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
