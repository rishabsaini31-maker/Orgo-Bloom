# FSHiP Shipping Integration: Quick Reference & Implementation Timeline

## Quick Reference Guide

### System Architecture Overview

```
Customer Places Order
    ↓
Payment Processing (Razorpay)
    ↓
Order Stored in DB
    ↓
Auto/Manual Shipment Creation
    ├─ Validate order & address
    ├─ Call FSHiP API (with retry)
    ├─ Store shipment details (AWB, ShipmentID)
    └─ Update order status → "shipped"
    ↓
FSHiP Webhook Events
    ├─ Picked
    ├─ In-Transit
    ├─ Delivered
    └─ RTO (Return to Origin)
    ↓
Customer Tracking
    └─ Real-time AWB tracking
```

---

## Implementation Roadmap (8 Weeks)

### Week 1-2: Foundation

**Objective**: Set up infrastructure and basic integration

- [ ] Set up PostgreSQL database and Redis
- [ ] Create Prisma models for Orders, Shipments, Events
- [ ] Implement FshipApiClient with authentication
- [ ] Configure environment variables
- [ ] Write unit tests for API client

**Deliverable**: Working FSHiP authentication and token caching

### Week 3: Core Services

**Objective**: Implement business logic layer

- [ ] Build OrderService (create, confirm, cancel)
- [ ] Build ShipmentService (create with retry logic)
- [ ] Build WebhookService (event processing)
- [ ] Implement Redis-based caching
- [ ] Add error queue processing

**Deliverable**: Shipment creation with exponential backoff retry

### Week 4: API Routes

**Objective**: Expose endpoints for CRUD operations

- [ ] POST /api/orders (create order)
- [ ] POST /api/orders/[id]/confirm (after payment)
- [ ] POST /api/admin/shipments/[id]/create-manual
- [ ] GET /api/orders/[id]/track (customer tracking)
- [ ] POST /api/internal/shipments/process-queue (cron)

**Deliverable**: Full API layer with authentication & validation

### Week 5: Webhook Integration

**Objective**: Handle real-time shipment updates from FSHiP

- [ ] Implement webhook signature verification
- [ ] Handle idempotency (prevent duplicate processing)
- [ ] Map FSHiP event types to internal statuses
- [ ] Update order status based on shipment events
- [ ] Implement webhook retry logic

**Deliverable**: Functional webhook handler for shipment updates

### Week 6: Admin Dashboard

**Objective**: Admin interface for shipment management

- [ ] Admin shipment list view (with filters/search)
- [ ] Manual shipment creation UI
- [ ] Bulk shipment creation feature
- [ ] Error queue monitoring & manual retry
- [ ] Shipment tracking integration

**Deliverable**: Operational admin panel for logistics management

### Week 7: Testing & Optimization

**Objective**: Ensure reliability and performance

- [ ] Integration tests for order-to-shipment flow
- [ ] Load testing (1000 concurrent orders)
- [ ] Webhook signature verification tests
- [ ] Error handling & edge cases
- [ ] Performance optimization (caching, batch operations)

**Deliverable**: Fully tested, optimized system

### Week 8: Deployment & Monitoring

**Objective**: Production readiness

- [ ] Set up Sentry error tracking
- [ ] Configure monitoring dashboards
- [ ] Register webhooks in FSHiP production
- [ ] Deploy to Vercel with production environment
- [ ] Documentation & runbooks
- [ ] Team training

**Deliverable**: Production-ready system with monitoring

---

## Technology Stack Summary

### Frontend (Customer)

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **State**: Zustand (existing)
- **Tracking**: Real-time AWB tracking UI

### Backend

- **Runtime**: Node.js (Vercel Functions)
- **Framework**: Next.js API Routes
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon)
- **Cache**: Redis
- **Job Queue**: Redis Lists (message queue)

### External Services

- **Logistics**: FSHiP API
- **Payment**: Razorpay (existing)
- **Monitoring**: Sentry
- **Deployment**: Vercel
- **Backups**: AWS S3

### Libraries

```json
{
  "dependencies": {
    "next": "14.2.35",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "ioredis": "^5.3.0",
    "zod": "^3.22.0",
    "jsonwebtoken": "^9.1.0",
    "react-hot-toast": "^2.4.1",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

---

## Key Configuration Files

### .env.production

```bash
# FSHiP
FSHIP_CLIENT_ID=your_client_id
FSHIP_CLIENT_SECRET=your_client_secret
FSHIP_BASE_URL=https://api.fship.in
FSHIP_WEBHOOK_SECRET=your_webhook_secret
FSHIP_WEBHOOK_URL=https://orgobloom.vercel.app/api/shipments/webhooks/fship

# Database
DATABASE_URL=postgresql://user:password@host/db

# Redis
REDIS_URL=redis://user:password@host:6379

# Security
JWT_SECRET=your_jwt_secret
INTERNAL_API_TOKEN=your_internal_token

# Store
STORE_PINCODE=110001
STORE_NAME=Orgobloom
STORE_EMAIL=store@orgobloom.com

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
```

### vercel.json

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

### prisma.schema (additions)

```prisma
model Order {
  id String @id @default(cuid())
  orderNumber String @unique
  customerId String
  // ... fields from database schema
  shipment Shipment?
}

model Shipment {
  id String @id @default(cuid())
  orderId String @unique
  fshipShipmentId String? @unique
  awbNumber String? @unique
  // ... tracking fields
  events ShipmentEvent[]
  errorQueue ShipmentErrorQueue?
}

model ShipmentEvent {
  id String @id @default(cuid())
  shipmentId String
  eventType String
  eventStatus String
  // ... event details
}

model ShipmentErrorQueue {
  id String @id @default(cuid())
  shipmentId String @unique
  errorType String
  retryCount Int @default(0)
  // ... retry logic
}
```

---

## Data Flow Examples

### Example 1: Customer Completes Payment → Automatic Shipment

```
1. Customer clicks "Pay" on checkout
   └─ POST /api/payments/verify (Razorpay webhook)

2. Backend updates Order:
   - payment_status = 'completed'
   - order_status = 'confirmed'

3. Pushes job to queue:
   - job:queue:create_shipment → {orderId, attempt: 1}

4. Cron job processes queue (every 5 sec):
   - Calls ShipmentService.createShipment(orderId)

5. ShipmentService calls FSHiP API:
   - GET /auth/login → Get token
   - POST /shipments/create → Create shipment
   - Returns: fshipShipmentId, awbNumber, courierPartner

6. Shipment stored in DB:
   - Shipment table created with fshipShipmentId, awbNumber
   - ShipmentEvent: 'created'
   - Order status → 'shipped'

7. Customer receives notification:
   - Email: "Your order shipped! AWB: XXX"
   - SMS: "Track here: https://track.fship.in/XXX"

8. Customer can track:
   - GET /api/orders/[id]/track
   - Calls FSHiP tracking API
   - Cached in Redis for 30 min
```

### Example 2: FSHiP Webhook → Order Delivered

```
1. FSHiP sends webhook:
   {
     "event_id": "evt_xxx",
     "event_type": "delivered",
     "awb_number": "AWB123",
     "timestamp": "2024-02-07T15:30:00Z"
   }

2. POST /api/shipments/webhooks/fship received

3. WebhookService validates:
   - Verify signature (HMAC-SHA256)
   - Check idempotency (event_id in Redis)
   - Found: Shipment by AWB

4. Creates ShipmentEvent:
   - eventType = 'delivered'
   - eventStatus = 'delivered'
   - fshipEventId = 'evt_xxx'

5. Updates Shipment:
   - shipment_status = 'delivered'
   - actual_delivery_date = NOW()

6. Updates Order:
   - order_status = 'delivered'

7. Stores in Redis:
   - webhook:idempotency:evt_xxx → '1' (24hr TTL)
   - This ensures duplicate webhooks are ignored

8. Customer sees update:
   - Order page shows: ✓ Delivered on Feb 7, 3:30 PM
   - Tracking history shows all events
```

### Example 3: Shipment Creation Fails → Automatic Retry

```
1. ShipmentService.createShipment() called
   └─ FSHiP API returns 503 (Service Unavailable)

2. Error caught, attempt = 1:
   - Queue retry: job:queue:create_shipment_retry
   - nextRetryAt = NOW + 2^1 sec = 2 seconds

3. Create error queue entry:
   - shipmentId, errorType, errorMessage
   - retryCount = 1, maxRetries = 5

4. After 2 seconds, retry processor picks it up:
   - Calls createShipment() again

5. If still fails:
   - nextRetryAt = NOW + 2^2 sec = 4 seconds
   - retryCount = 2

6. Retry sequence: 1s → 2s → 4s → 8s → 16s
   (exponential backoff)

7. After 5th failure:
   - Mark: error_status = 'MANUAL_INTERVENTION_REQUIRED'
   - isResolved = true
   - Alert admin dashboard

8. Admin can view error:
   - See order, reason for failure
   - Click "Retry" or "Manual Create"
```

---

## Testing Strategy

### Unit Tests

```typescript
// lib/__tests__/fship-client.test.ts
describe('FshipApiClient', () => {
  it('should authenticate and cache token', async () => {
    const token = await fshipClient.getAuthToken();
    expect(token).toBeDefined();

    // Second call should use cache
    const token2 = await fshipClient.getAuthToken();
    expect(token2).toBe(token);
  });

  it('should create shipment with valid data', async () => {
    const result = await fshipClient.createShipment({...});
    expect(result.shipmentId).toBeDefined();
    expect(result.awbNumber).toBeDefined();
  });

  it('should verify webhook signature correctly', () => {
    const payload = '{"event":"test"}';
    const signature = crypto.createHmac('sha256', secret)
      .update(payload).digest('hex');

    expect(fshipClient.verifyWebhookSignature(payload, signature))
      .toBe(true);
  });
});
```

### Integration Tests

```typescript
// __tests__/shipment-flow.test.ts
describe('Order to Shipment Flow', () => {
  it('should create order, confirm, and generate shipment', async () => {
    // 1. Create order
    const order = await orderService.createOrder({...});
    expect(order.orderStatus).toBe('pending');

    // 2. Confirm payment
    await orderService.confirmOrder(order.id);
    const updatedOrder = await db.order.findUnique({where: {id: order.id}});
    expect(updatedOrder.orderStatus).toBe('confirmed');

    // 3. Process queue (simulate cron)
    await shipmentService.createShipment(order.id);
    const shipment = await db.shipment.findUnique({where: {orderId: order.id}});
    expect(shipment?.awbNumber).toBeDefined();
  });
});
```

### End-to-End Tests

```typescript
// e2e/shipping.test.ts
describe('Shipping E2E', () => {
  it('should handle full order lifecycle', async () => {
    // Simulate customer checkout → delivery
    const browser = await puppeteer.launch();

    // Place order
    await page.goto('http://localhost:3000/checkout');
    await page.click('[data-testid="place-order"]');

    // Complete payment
    await page.click('[data-testid="pay"]');

    // Verify shipment creation
    await new Promise(r => setTimeout(r, 2000)); // Wait for queue
    const shipment = await db.shipment.findFirst();
    expect(shipment?.awbNumber).toBeDefined();

    // Simulate webhook
    await fetch('http://localhost:3000/api/shipments/webhooks/fship', {
      method: 'POST',
      body: JSON.stringify({...delivered_event}),
      headers: {'x-fship-signature': signature}
    });

    // Verify order delivered
    const order = await db.order.findUnique({where: {id: ...}});
    expect(order.orderStatus).toBe('delivered');
  });
});
```

---

## Common Issues & Troubleshooting

| Issue                          | Cause                      | Solution                            |
| ------------------------------ | -------------------------- | ----------------------------------- |
| "Invalid signature" on webhook | Secret mismatch            | Verify FSHIP_WEBHOOK_SECRET in .env |
| Shipments stuck in "pending"   | Error queue not processing | Check cron job running, check logs  |
| FSHiP API 400 errors           | Invalid address format     | Implement pincode validation        |
| Duplicate shipment creation    | Idempotency key issue      | Check shipment unique constraint    |
| High webhook latency           | Database queue full        | Increase worker processes           |
| Memory leak on Redis           | Large cache entries        | Set TTL on all cached keys          |
| Orders not tracking            | Missing AWB number         | Check shipment creation succeeded   |
| Customer sees wrong status     | Webhook ordering issue     | Use eventTimestamp to order events  |

---

## Performance Benchmarks

### Expected Performance (with optimizations)

| Operation                   | Time       | Notes                   |
| --------------------------- | ---------- | ----------------------- |
| Create order                | 50-100ms   | DB + validation         |
| Create shipment (FSHiP API) | 500-1500ms | Network + API           |
| Webhook processing          | 50-200ms   | Idempotency + DB update |
| Get tracking (cached)       | 5-10ms     | Redis cache hit         |
| Get tracking (fresh)        | 200-500ms  | FSHiP API call          |
| Error queue retry           | 100-300ms  | Per-item processing     |

### Load Test Expectations

```
Scenario: 1000 orders/minute for 1 hour

Hardware:
- Vercel Functions (auto-scale)
- PostgreSQL (2vCPU, 4GB RAM)
- Redis (1GB)

Results:
- API Response Time (p95): 150ms
- Shipment Creation Success Rate: 99.2%
- Average Error Queue: 5-10 items
- Database: ~20 active connections
- Redis Memory: 200-300MB
- Estimated FSHiP API calls: 600-720/min
```

---

## Maintenance Tasks

### Weekly

- [ ] Check error queue size
- [ ] Review error logs in Sentry
- [ ] Verify webhook deliveries

### Monthly

- [ ] Audit shipment creation metrics
- [ ] Review FSHiP account for unused features
- [ ] Test disaster recovery procedures
- [ ] Update courier config caches

### Quarterly

- [ ] Load testing with increased volume
- [ ] Security audit (webhook signatures, token rotation)
- [ ] Cost analysis and optimization
- [ ] Team training on incident response

---

## Support & Resources

### FSHiP Documentation

- API Docs: https://docs.fship.in
- Webhook Events: https://docs.fship.in/webhooks
- Address Validation: https://docs.fship.in/address-validation

### Monitoring Dashboards

- Sentry: https://sentry.io/dashboard
- Vercel Analytics: https://vercel.com/dashboard
- Custom Metrics: Cloud Monitoring tool

### Contact

- FSHiP Support: support@fship.in
- Your Error Queue: `/api/admin/shipments/errors`
- Production Logs: Vercel Functions logs
