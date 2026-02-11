import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Search
    const search = searchParams.get("search") || "";

    // Filters
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const minRating = searchParams.get("minRating")
      ? parseInt(searchParams.get("minRating")!)
      : undefined;
    const inStock = searchParams.get("inStock") === "true";

    // Sorting
    const sort = searchParams.get("sort") || "newest"; // newest, price-low, price-high, popular, rating

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { search: search, mode: "insensitive" } },
        { description: { search: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    // Build order clause
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-low") {
      orderBy = { price: "asc" };
    } else if (sort === "price-high") {
      orderBy = { price: "desc" };
    } else if (sort === "popular") {
      orderBy = { orderItems: { _count: "desc" } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          stock: true,
          category: true,
          reviews: {
            where: { status: "APPROVED" },
            select: { rating: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Add average rating to each product
    const productsWithRating = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          : 0;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        category: product.category,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length,
      };
    });

    return successResponse({
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        category,
        minPrice,
        maxPrice,
        minRating,
        inStock,
        sort,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
