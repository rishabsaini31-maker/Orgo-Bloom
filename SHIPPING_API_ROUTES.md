# FSHiP API Routes Implementation Guide

## API Route Patterns

### 1. Create Order (Existing Enhancement)

**Route**: `POST /api/orders`

```typescript
// app/api/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { OrderService } from "@/lib/services/order-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const itemIds = body.items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: itemIds } },
    });

    if (products.length !== itemIds.length) {
      return NextResponse.json(
        { error: "Some products not found" },
        { status: 400 },
      );
    }

    // Create cart items with pricing
    const items = body.items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId)!;
      const discountedPrice = product.price * 0.7; // 30% discount

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: discountedPrice,
      };
    });

    const orderService = new OrderService(fshipClient, redis);
    const order = await orderService.createOrder({
      customerId: authResult.user.id,
      items,
      shippingAddress: {
        name: body.shippingAddress.name,
        email: body.shippingAddress.email,
        phone: body.shippingAddress.phone,
        address1: body.shippingAddress.addressLine1,
        address2: body.shippingAddress.addressLine2,
        city: body.shippingAddress.city,
        state: body.shippingAddress.state,
        pincode: body.shippingAddress.pincode,
      },
      paymentMethod: body.paymentMethod,
      razorpayPaymentId: body.razorpayPaymentId,
    });

    return NextResponse.json(
      {
        message: "Order created successfully",
        order,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 2. Create Shipment Manually (Admin)

**Route**: `POST /api/admin/shipments/[id]/create-manual`

```typescript
// app/api/admin/shipments/[id]/create-manual/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { ShipmentService } from "@/lib/services/shipment-service";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Authenticate and verify admin role
    const authResult = await verifyAuth(request);
    if (!authResult.user || authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Rate limiting
    const rateLimitCheck = await checkRateLimit(
      redis,
      `admin:${authResult.user.id}`,
      10, // 10 requests
      60, // per 60 seconds
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    const orderId = params.id;
    const body = await request.json();

    // Validate order exists and is eligible for shipment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shipment: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.shipment) {
      return NextResponse.json(
        { error: "Shipment already exists for this order" },
        { status: 400 },
      );
    }

    if (order.orderStatus !== "confirmed") {
      return NextResponse.json(
        { error: "Order must be confirmed before creating shipment" },
        { status: 400 },
      );
    }

    // Create shipment
    const shipmentService = new ShipmentService(fshipClient, redis);
    const shipment = await shipmentService.createShipment(orderId);

    return NextResponse.json(
      {
        message: "Shipment created successfully",
        shipment,
      },
      { status: 201 },
    );
  } catch (error: any) {
    // Log error for monitoring
    console.error("Shipment creation error:", {
      orderId: params.id,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 3. Webhook Handler (FSHiP → Your System)

**Route**: `POST /api/shipments/webhooks/fship`

```typescript
// app/api/shipments/webhooks/fship/route.ts

import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/lib/services/webhook-service";
import FshipApiClient from "@/lib/fship-client";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);
const fshipClient = new FshipApiClient(
  {
    baseUrl: process.env.FSHIP_BASE_URL!,
    clientId: process.env.FSHIP_CLIENT_ID!,
    clientSecret: process.env.FSHIP_CLIENT_SECRET!,
    webhookSecret: process.env.FSHIP_WEBHOOK_SECRET!,
  },
  redis,
);

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-fship-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = fshipClient.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      // Log security incident
      console.error("Invalid webhook signature", {
        signature,
        receivedAt: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for"),
      });

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse payload
    const payload = JSON.parse(rawBody);

    // Process webhook
    const webhookService = new WebhookService(redis);
    const result = await webhookService.handleFshipWebhook(payload);

    // Always return 200 to FSHiP (idempotent)
    return NextResponse.json({ status: "processed" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", {
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    // Return 200 anyway to prevent FSHiP retries
    // Error is logged and manual intervention can be triggered
    return NextResponse.json(
      { status: "processing_error_logged" },
      { status: 200 },
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-fship-signature",
    },
  });
}
```

---

### 4. Get Shipment Tracking (Customer)

**Route**: `GET /api/orders/[id]/track`

```typescript
// app/api/orders/[id]/track/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { ShipmentService } from "@/lib/services/shipment-service";
import { prisma } from "@/lib/prisma";
import Redis from "ioredis";
import FshipApiClient from "@/lib/fship-client";

const redis = new Redis(process.env.REDIS_URL!);
const fshipClient = new FshipApiClient(
  {
    baseUrl: process.env.FSHIP_BASE_URL!,
    clientId: process.env.FSHIP_CLIENT_ID!,
    clientSecret: process.env.FSHIP_CLIENT_SECRET!,
    webhookSecret: process.env.FSHIP_WEBHOOK_SECRET!,
  },
  redis,
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Authenticate
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;

    // Verify order belongs to customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shipment: {
          include: {
            events: {
              orderBy: { eventTimestamp: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.customerId !== authResult.user.id &&
      authResult.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!order.shipment) {
      return NextResponse.json({
        message: "No shipment created yet",
        shipment: null,
        tracking: null,
      });
    }

    // Check Redis cache first
    const cached = await redis.get(`order:track:${orderId}`);
    if (cached) {
      return NextResponse.json({
        message: "Tracking information",
        shipment: order.shipment,
        tracking: JSON.parse(cached),
        cachedAt: new Date(),
      });
    }

    // Get real-time tracking
    const shipmentService = new ShipmentService(fshipClient, redis);
    const tracking = await shipmentService.getTracking(order.shipment.id);

    return NextResponse.json({
      message: "Tracking information",
      shipment: order.shipment,
      tracking,
      recentEvents: order.shipment.events,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 5. Admin: Bulk Shipment Creation

**Route**: `POST /api/admin/shipments/bulk-create`

```typescript
// app/api/admin/shipments/bulk-create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { ShipmentService } from "@/lib/services/shipment-service";
import { prisma } from "@/lib/prisma";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await verifyAuth(request);
    if (!authResult.user || authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const orderIds = body.orderIds as string[]; // Array of order IDs

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds must be non-empty array" },
        { status: 400 },
      );
    }

    if (orderIds.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 orders per request" },
        { status: 400 },
      );
    }

    // Queue all orders for shipment creation
    const shipmentService = new ShipmentService(fshipClient, redis);
    const results = [];

    for (const orderId of orderIds) {
      try {
        const shipment = await shipmentService.createShipment(orderId);
        results.push({
          orderId,
          status: "success",
          shipmentId: shipment.id,
        });
      } catch (error: any) {
        results.push({
          orderId,
          status: "error",
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failureCount = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      message: `Processed ${orderIds.length} orders`,
      summary: {
        total: orderIds.length,
        successful: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 6. Internal: Process Error Queue

**Route**: `POST /api/internal/shipments/process-queue`

This endpoint is called by a background task (cron job or scheduled task).

```typescript
// app/api/internal/shipments/process-queue/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ShipmentService } from "@/lib/services/shipment-service";
import Redis from "ioredis";
import FshipApiClient from "@/lib/fship-client";

const redis = new Redis(process.env.REDIS_URL!);
const fshipClient = new FshipApiClient(
  {
    baseUrl: process.env.FSHIP_BASE_URL!,
    clientId: process.env.FSHIP_CLIENT_ID!,
    clientSecret: process.env.FSHIP_CLIENT_SECRET!,
    webhookSecret: process.env.FSHIP_WEBHOOK_SECRET!,
  },
  redis,
);

// Verify internal request (e.g., from cron job)
function verifyInternalRequest(request: NextRequest): boolean {
  const token = request.headers.get("x-internal-token");
  return token === process.env.INTERNAL_API_TOKEN;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request
    if (!verifyInternalRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shipmentService = new ShipmentService(fshipClient, redis);

    // Process error queue
    await shipmentService.processErrorQueue();

    return NextResponse.json({
      message: "Error queue processed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error queue processing failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Cron Job Configuration (Vercel)

Add to `vercel.json` for scheduled background jobs:

```json
{
  "crons": [
    {
      "path": "/api/internal/shipments/process-queue",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/internal/shipments/sync-status",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Response Formats

### Successful Order Response

```json
{
  "message": "Order created successfully",
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-1234567890-ABC123",
    "customerId": "uuid",
    "totalAmount": 500.0,
    "orderStatus": "pending",
    "paymentStatus": "pending",
    "items": [
      {
        "productId": "uuid",
        "productName": "Organic Fertilizer 1kg",
        "quantity": 2,
        "unitPrice": 250.0,
        "totalPrice": 500.0
      }
    ],
    "createdAt": "2024-02-07T10:30:00Z"
  }
}
```

### Successful Shipment Response

```json
{
  "message": "Shipment created successfully",
  "shipment": {
    "id": "uuid",
    "orderId": "uuid",
    "fshipShipmentId": "FSHIP123456",
    "awbNumber": "AWB123456789",
    "courierPartnerId": "FEDEX",
    "courierPartnerName": "FedEx",
    "shipmentStatus": "created",
    "weightKg": 2.5,
    "createdAt": "2024-02-07T10:35:00Z"
  }
}
```

### Tracking Response

```json
{
  "message": "Tracking information",
  "shipment": {
    "id": "uuid",
    "awbNumber": "AWB123456789",
    "shipmentStatus": "in_transit"
  },
  "tracking": {
    "status": "in_transit",
    "location": "Delhi Distribution Center",
    "lastUpdate": "2024-02-07T14:20:00Z",
    "estimatedDelivery": "2024-02-08T18:00:00Z",
    "events": [
      {
        "timestamp": "2024-02-07T14:20:00Z",
        "status": "picked",
        "location": "Warehouse, Delhi",
        "description": "Package picked up"
      },
      {
        "timestamp": "2024-02-07T16:45:00Z",
        "status": "in_transit",
        "location": "Delhi Hub",
        "description": "In transit to destination"
      }
    ]
  }
}
```

---

## Error Responses

### Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded",
  "status": 429,
  "remaining": 0,
  "resetAt": "2024-02-07T10:31:00Z"
}
```

### Invalid Signature

```json
{
  "error": "Invalid signature",
  "status": 401
}
```

### Order Not Found

```json
{
  "error": "Order not found",
  "status": 404
}
```
