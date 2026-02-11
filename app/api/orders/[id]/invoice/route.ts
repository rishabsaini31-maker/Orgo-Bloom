import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { generateInvoicePDF } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get order with all details
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Only allow invoice download for completed or delivered orders
    if (!["DELIVERED", "SHIPPED", "PROCESSING"].includes(order.status)) {
      throw new ApiError("Invoice not available for this order", 400);
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      order,
      user: order.user,
    });

    // Convert Buffer to Uint8Array for Response
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF
    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
