# Shipping Services Implementation Guide

## Core Service Classes

### 1. FSHiP API Client Service

```typescript
// lib/fship-client.ts

import Redis from 'ioredis';
import crypto from 'crypto';

interface FshipConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
}

interface AuthToken {
  token: string;
  type: string;
  expiresAt: Date;
}

class FshipApiClient {
  private config: FshipConfig;
  private redis: Redis;

  constructor(config: FshipConfig, redis: Redis) {
    this.config = config;
    this.redis = redis;
  }

  /**
   * Get or refresh authentication token
   * Caches in Redis with TTL before expiry
   */
  async getAuthToken(): Promise<string> {
    const cacheKey = 'fship:auth:token';
    
    // Check Redis cache first
    const cachedToken = await this.redis.get(cacheKey);
    if (cachedToken) {
      const parsed = JSON.parse(cachedToken);
      return parsed.token;
    }

    // Request new token from FSHiP
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`
          ).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`FSHiP auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      const token: AuthToken = {
        token: data.access_token,
        type: data.token_type,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000))
      };

      // Cache token in Redis (refresh 5 min before expiry)
      const ttlSeconds = (token.expiresAt.getTime() - Date.now()) / 1000 - 300;
      await this.redis.setex(cacheKey, Math.floor(ttlSeconds), JSON.stringify(token));

      return token.token;
    } catch (error) {
      throw new Error(`Failed to get FSHiP auth token: ${error.message}`);
    }
  }

  /**
   * Create shipment on FSHiP
   * Returns shipment ID and AWB number
   */
  async createShipment(shipmentData: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      weight: number; // kg
    }>;
    paymentMethod: 'COD' | 'PREPAID';
    codAmount?: number; // Only for COD
  }): Promise<{
    shipmentId: string;
    awbNumber: string;
    courierPartnerId: string;
    courierPartnerName: string;
  }> {
    try {
      const token = await this.getAuthToken();

      // Calculate total weight
      const totalWeight = shipmentData.items.reduce(
        (sum, item) => sum + (item.weight * item.quantity),
        0
      );

      const payload = {
        reference_id: shipmentData.orderId,
        order_reference: shipmentData.orderNumber,
        
        // Shipping Address
        shipping_address: {
          name: shipmentData.customerName,
          email: shipmentData.customerEmail,
          phone: this.normalizePhone(shipmentData.customerPhone),
          address_line_1: shipmentData.deliveryAddress.line1,
          address_line_2: shipmentData.deliveryAddress.line2 || '',
          city: shipmentData.deliveryAddress.city,
          state: shipmentData.deliveryAddress.state,
          pincode: shipmentData.deliveryAddress.pincode,
          country: shipmentData.deliveryAddress.country
        },

        // Package Details
        package_details: {
          weight: totalWeight,
          dimensions: {
            length: 20,
            width: 15,
            height: 10
          },
          contents: shipmentData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            weight: item.weight
          }))
        },

        // Payment Method
        payment_method: shipmentData.paymentMethod,
        ...(shipmentData.paymentMethod === 'COD' && {
          cod_amount: shipmentData.codAmount
        }),

        // Service Options
        service_type: 'standard_delivery',
        pickup_location: process.env.STORE_PINCODE || '110001'
      };

      const response = await fetch(
        `${this.config.baseUrl}/v1/shipments/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Request-ID': crypto.randomUUID()
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `FSHiP create shipment failed: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();

      return {
        shipmentId: result.shipment_id,
        awbNumber: result.awb_number,
        courierPartnerId: result.assigned_courier.id,
        courierPartnerName: result.assigned_courier.name
      };
    } catch (error) {
      throw new Error(`Failed to create shipment on FSHiP: ${error.message}`);
    }
  }

  /**
   * Get real-time tracking information
   */
  async getTracking(awbNumber: string): Promise<{
    status: string;
    location: string;
    lastUpdate: Date;
    estimatedDelivery?: Date;
    events: Array<{
      timestamp: Date;
      status: string;
      location: string;
      description: string;
    }>;
  }> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${this.config.baseUrl}/v1/shipments/track/${awbNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`FSHiP tracking failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        status: data.current_status,
        location: data.current_location,
        lastUpdate: new Date(data.last_update),
        estimatedDelivery: data.estimated_delivery 
          ? new Date(data.estimated_delivery) 
          : undefined,
        events: data.tracking_events.map((event: any) => ({
          timestamp: new Date(event.timestamp),
          status: event.status,
          location: event.location,
          description: event.description
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get tracking: ${error.message}`);
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(shipmentId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${this.config.baseUrl}/v1/shipments/${shipmentId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Customer cancelled order'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`FSHiP cancel failed: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to cancel shipment: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    const calculatedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  }

  /**
   * Utility: Normalize Indian phone number
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // If doesn't start with 91, add it
    if (!cleaned.startsWith('91')) {
      cleaned = '91' + cleaned;
    }
    
    return '+' + cleaned;
  }
}

export default FshipApiClient;
```

---

### 2. Order Service

```typescript
// lib/services/order-service.ts

import { prisma } from '@/lib/prisma';
import FshipApiClient from '@/lib/fship-client';
import Redis from 'ioredis';

interface CreateOrderPayload {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'RAZORPAY_PREPAID' | 'COD';
  razorpayPaymentId?: string;
}

export class OrderService {
  constructor(
    private fshipClient: FshipApiClient,
    private redis: Redis
  ) {}

  /**
   * Create new order
   */
  async createOrder(payload: CreateOrderPayload) {
    try {
      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      // Calculate totals
      let subtotal = 0;
      const items = [];

      for (const item of payload.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;

        items.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal,
          productName: product.name,
          productWeight: product.weight
        });
      }

      // Calculate shipping (free over ₹999)
      const shippingCharges = subtotal >= 999 ? 0 : 50;
      const totalAmount = subtotal + shippingCharges;

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: payload.customerId,
          subtotal,
          shippingCharges,
          tax: 0,
          discount: 0,
          totalAmount,
          paymentMethod: payload.paymentMethod,
          paymentStatus: 'pending',
          orderStatus: 'pending',
          shippingName: payload.shippingAddress.name,
          shippingEmail: payload.shippingAddress.email,
          shippingPhone: payload.shippingAddress.phone,
          shippingAddressLine1: payload.shippingAddress.address1,
          shippingAddressLine2: payload.shippingAddress.address2,
          shippingCity: payload.shippingAddress.city,
          shippingState: payload.shippingAddress.state,
          shippingPincode: payload.shippingAddress.pincode,
          razorpayPaymentId: payload.razorpayPaymentId,
          items: {
            create: items
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return order;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Confirm order after successful payment
   * Queues shipment creation
   */
  async confirmOrder(orderId: string) {
    try {
      // Update order status
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'confirmed',
          paymentStatus: 'completed'
        },
        include: {
          items: true
        }
      });

      // Queue shipment creation job
      await this.redis.lpush(
        'job:queue:create_shipment',
        JSON.stringify({
          orderId,
          createdAt: new Date().toISOString(),
          attempt: 1
        })
      );

      return order;
    } catch (error) {
      throw new Error(`Failed to confirm order: ${error.message}`);
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shipment: true }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Not cancelled if already shipped
      if (order.shipment && order.shipment.shipmentStatus !== 'pending') {
        throw new Error('Cannot cancel shipped order');
      }

      // Cancel associated shipment if exists
      if (order.shipment) {
        await this.fshipClient.cancelShipment(order.shipment.fshipShipmentId!);
      }

      // Update order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'cancelled',
          cancelledAt: new Date(),
          notes: reason
        }
      });

      return order;
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }
}
```

---

### 3. Shipment Service

```typescript
// lib/services/shipment-service.ts

import { prisma } from '@/lib/prisma';
import FshipApiClient from '@/lib/fship-client';
import Redis from 'ioredis';

export class ShipmentService {
  constructor(
    private fshipClient: FshipApiClient,
    private redis: Redis
  ) {}

  /**
   * Create shipment for order
   * Implements exponential backoff retry
   */
  async createShipment(orderId: string, attempt = 1): Promise<any> {
    const maxAttempts = 5;

    try {
      // Fetch order with items
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true }
          },
          customer: true,
          shipment: true
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Prevent duplicate shipments
      if (order.shipment) {
        return order.shipment;
      }

      // Create shipment on FSHiP
      const fshipShipment = await this.fshipClient.createShipment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.shippingName,
        customerEmail: order.shippingEmail,
        customerPhone: order.shippingPhone,
        deliveryAddress: {
          line1: order.shippingAddressLine1,
          line2: order.shippingAddressLine2!,
          city: order.shippingCity,
          state: order.shippingState,
          pincode: order.shippingPincode,
          country: order.shippingCountry
        },
        items: order.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          weight: this.extractWeight(item.productWeight)
        })),
        paymentMethod: order.paymentMethod === 'RAZORPAY_PREPAID' ? 'PREPAID' : 'COD',
        ...(order.paymentMethod === 'COD' && {
          codAmount: order.totalAmount
        })
      });

      // Store shipment in database
      const shipment = await prisma.shipment.create({
        data: {
          orderId,
          fshipShipmentId: fshipShipment.shipmentId,
          awbNumber: fshipShipment.awbNumber,
          courierPartnerId: fshipShipment.courierPartnerId,
          courierPartnerName: fshipShipment.courierPartnerName,
          shipmentStatus: 'created',
          weightKg: order.items.reduce(
            (sum, item) => sum + this.extractWeight(item.productWeight) * item.quantity,
            0
          )
        }
      });

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'shipped'
        }
      });

      return shipment;
    } catch (error) {
      // Exponential backoff retry
      if (attempt < maxAttempts) {
        const retryDelayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
        
        // Queue retry
        await this.redis.lpush(
          'job:queue:create_shipment_retry',
          JSON.stringify({
            orderId,
            createdAt: new Date().toISOString(),
            attempt: attempt + 1,
            nextRetryAt: new Date(Date.now() + retryDelayMs).toISOString()
          })
        );

        // Also store in error queue
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { shipment: true }
        });

        if (!order?.shipment) {
          // Create pending shipment record
          const pendingShipment = await prisma.shipment.create({
            data: {
              orderId,
              shipmentStatus: 'pending',
              isError: true,
              creationAttempts: attempt,
              creationErrorMessage: error.message,
              lastCreationAttemptAt: new Date()
            }
          });

          await prisma.shipmentErrorQueue.create({
            data: {
              shipmentId: pendingShipment.id,
              errorType: 'creation_failed',
              errorMessage: error.message,
              retryCount: attempt,
              maxRetries: maxAttempts,
              nextRetryAt: new Date(Date.now() + retryDelayMs)
            }
          });
        }
      } else {
        // Max retries exceeded - requires manual intervention
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { shipment: true }
        });

        if (!order?.shipment) {
          const errorShipment = await prisma.shipment.create({
            data: {
              orderId,
              shipmentStatus: 'pending',
              isError: true,
              errorStatus: 'MANUAL_INTERVENTION_REQUIRED',
              creationAttempts: attempt,
              creationErrorMessage: error.message,
              lastCreationAttemptAt: new Date()
            }
          });

          await prisma.shipmentErrorQueue.create({
            data: {
              shipmentId: errorShipment.id,
              errorType: 'creation_failed',
              errorMessage: error.message,
              retryCount: attempt,
              maxRetries: maxAttempts,
              isResolved: true,
              resolutionNotes: 'Max retries exceeded - requires admin intervention'
            }
          });
        }
      }

      throw error;
    }
  }

  /**
   * Get shipment tracking
   */
  async getTracking(shipmentId: string) {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          events: {
            orderBy: { eventTimestamp: 'desc' }
          }
        }
      });

      if (!shipment?.awbNumber) {
        throw new Error('Shipment not found or AWB not generated');
      }

      // Get real-time tracking from FSHiP
      const tracking = await this.fshipClient.getTracking(shipment.awbNumber);

      // Cache in Redis for 30 minutes
      await this.redis.setex(
        `order:track:${shipment.orderId}`,
        1800,
        JSON.stringify(tracking)
      );

      return tracking;
    } catch (error) {
      throw new Error(`Failed to get tracking: ${error.message}`);
    }
  }

  /**
   * Process error queue and retry shipment creation
   */
  async processErrorQueue() {
    try {
      const pendingErrors = await prisma.shipmentErrorQueue.findMany({
        where: {
          isResolved: false,
          nextRetryAt: {
            lte: new Date()
          }
        }
      });

      for (const errorEntry of pendingErrors) {
        try {
          const shipment = await prisma.shipment.findUnique({
            where: { id: errorEntry.shipmentId },
            include: { order: true }
          });

          if (!shipment) continue;

          // Retry shipment creation
          await this.createShipment(shipment.orderId, errorEntry.retryCount + 1);

          // Mark as resolved
          await prisma.shipmentErrorQueue.update({
            where: { id: errorEntry.id },
            data: {
              isResolved: true,
              resolutionNotes: 'Retry successful'
            }
          });
        } catch (retryError) {
          console.error(`Retry failed for shipment ${errorEntry.shipmentId}:`, retryError);
        }
      }
    } catch (error) {
      console.error('Error processing error queue:', error);
    }
  }

  /**
   * Extract weight from product weight string (e.g., "1 kg" -> 1)
   */
  private extractWeight(weightStr: string): number {
    const match = weightStr.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0.5; // Default 0.5 kg for fertilizers
  }
}
```

---

### 4. Webhook Handler Service

```typescript
// lib/services/webhook-service.ts

import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';
import crypto from 'crypto';

interface WebhookPayload {
  event_id: string;
  shipment_id: string;
  awb_number: string;
  event_type: string;
  event_status: string;
  timestamp: string;
  location: string;
  description?: string;
}

export class WebhookService {
  constructor(private redis: Redis) {}

  /**
   * Handle FSHiP webhook with idempotency
   */
  async handleFshipWebhook(payload: WebhookPayload) {
    const webhookId = payload.event_id;

    try {
      // Check idempotency
      const idempotencyKey = `webhook:idempotency:${webhookId}`;
      const alreadyProcessed = await this.redis.get(idempotencyKey);

      if (alreadyProcessed) {
        console.log(`Webhook ${webhookId} already processed`);
        return { status: 'already_processed' };
      }

      // Get shipment
      const shipment = await prisma.shipment.findUnique({
        where: { awbNumber: payload.awb_number },
        include: { order: true }
      });

      if (!shipment) {
        throw new Error(`Shipment not found for AWB ${payload.awb_number}`);
      }

      // Create event log
      const event = await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          fshipEventId: webhookId,
          eventType: this.mapEventType(payload.event_type),
          eventStatus: payload.event_status,
          location: payload.location,
          eventTimestamp: new Date(payload.timestamp),
          description: payload.description,
          webhookReceivedAt: new Date(),
          idempotencyKey,
          processedAt: new Date()
        }
      });

      // Update shipment status based on event
      const statusUpdate = this.mapShipmentStatus(payload.event_type);
      if (statusUpdate) {
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            shipmentStatus: statusUpdate,
            lastDeliveryLocation: payload.location,
            ...(statusUpdate === 'delivered' && {
              actualDeliveryDate: new Date(payload.timestamp)
            })
          }
        });
      }

      // Update order status if final status
      if (statusUpdate === 'delivered' || statusUpdate === 'rto') {
        const orderStatus = statusUpdate === 'delivered' ? 'delivered' : 'rto';
        await prisma.order.update({
          where: { id: shipment.orderId },
          data: { orderStatus }
        });
      }

      // Mark as processed in Redis (24-hour TTL)
      await this.redis.setex(idempotencyKey, 86400, '1');

      return { status: 'processed', event };
    } catch (error) {
      console.error(`Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map FSHiP event type to internal event type
   */
  private mapEventType(fshipEventType: string): string {
    const mapping: Record<string, string> = {
      'pickup_requested': 'pickup_requested',
      'picked': 'picked',
      'in_transit': 'in_transit',
      'out_for_delivery': 'in_transit',
      'delivered': 'delivered',
      'delivery_failed': 'exception',
      'rto_initiated': 'rto',
      'rto_delivered': 'rto',
      'cancelled': 'exception'
    };
    return mapping[fshipEventType] || 'exception';
  }

  /**
   * Map FSHiP event to shipment status
   */
  private mapShipmentStatus(
    fshipEventType: string
  ): string | null {
    const mapping: Record<string, string> = {
      'picked': 'picked',
      'in_transit': 'in_transit',
      'out_for_delivery': 'in_transit',
      'delivered': 'delivered',
      'rto_initiated': 'rto',
      'rto_delivered': 'rto'
    };
    return mapping[fshipEventType] || null;
  }
}
```

---

## Rate Limiting Middleware

```typescript
// lib/middleware/rate-limit.ts

import Redis from 'ioredis';

export async function checkRateLimit(
  redis: Redis,
  key: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowKey = `rate_limit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  const count = await redis.incr(windowKey);
  
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds + 1);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count)
  };
}
```

---

## Background Job Processor

```typescript
// lib/services/background-job-processor.ts

export async function processBackgroundJobs() {
  const redis = new Redis(process.env.REDIS_URL);
  const fshipClient = new FshipApiClient({ /* config */ }, redis);
  const shipmentService = new ShipmentService(fshipClient, redis);

  setInterval(async () => {
    try {
      // Process shipment creation queue
      while (true) {
        const job = await redis.rpop('job:queue:create_shipment');
        if (!job) break;

        const { orderId } = JSON.parse(job);
        try {
          await shipmentService.createShipment(orderId);
        } catch (error) {
          console.error(`Failed to create shipment for order ${orderId}:`, error);
        }
      }

      // Process error queue retries
      await shipmentService.processErrorQueue();
    } catch (error) {
      console.error('Background job processor error:', error);
    }
  }, 30000); // Run every 30 seconds
}
```

---

## Environment Variables

```bash
# FSHiP Configuration
FSHIP_CLIENT_ID=your_client_id
FSHIP_CLIENT_SECRET=your_client_secret
FSHIP_BASE_URL=https://api.fship.in
FSHIP_WEBHOOK_SECRET=your_webhook_secret
FSHIP_WEBHOOK_URL=https://yourdomain.com/api/shipments/webhooks/fship

# Store Information
STORE_PINCODE=110001
STORE_NAME=Orgobloom
STORE_EMAIL=store@orgobloom.com
STORE_PHONE=+919876543210

# Redis
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://...
```

