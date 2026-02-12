import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { handleApiError, successResponse, ApiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      console.error("[Analytics] No user authenticated");
      throw new ApiError("Authentication required. Please log in.", 401);
    }

    if (!isAdmin(user)) {
      console.error("[Analytics] User not admin:", {
        userId: user.userId,
        role: user.role,
      });
      throw new ApiError(
        `Admin access required. Your current role: ${user.role || "CUSTOMER"}. Please contact an administrator to gain access.`,
        403,
      );
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Fetch analytics data
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      pendingOrders,
      ordersByStatus,
      revenueByDay,
      topProducts,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),

      // Total revenue
      prisma.order.aggregate({
        where: { paymentStatus: "COMPLETED" },
        _sum: { total: true },
      }),

      // Total customers
      prisma.user.count({ where: { role: "CUSTOMER" } }),

      // Pending orders
      prisma.order.count({
        where: { status: { in: ["PENDING", "PROCESSING"] } },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // Revenue by day (last N days)
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as order_count,
          SUM(total)::float as revenue
        FROM orders
        WHERE "createdAt" >= ${startDate}
        AND "paymentStatus" = 'COMPLETED'
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `,

      // Top selling products
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        _count: { productId: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
    ]);

    // Get product details for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, imageUrl: true, price: true },
    });

    const topProductsWithDetails = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        product,
        totalSold: item._sum.quantity,
        orderCount: item._count.productId,
      };
    });

    return successResponse({
      overview: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalCustomers,
        pendingOrders,
      },
      ordersByStatus,
      revenueByDay,
      topProducts: topProductsWithDetails,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
