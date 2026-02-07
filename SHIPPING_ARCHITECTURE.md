# FSHiP Shipping Architecture - Orgobloom E-Commerce Platform

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ORGOBLOOM SHIPPING SYSTEM                        │
└─────────────────────────────────────────────────────────────────────────┘

                           ┌──────────────────┐
                           │   CUSTOMER SIDE  │
                           ├──────────────────┤
                           │ • Browse Products│
                           │ • Checkout       │
                           │ • Track Orders   │
                           └────────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │ Auth Routes  │  │ Order Routes │  │ Track Routes │
         └──────────────┘  └──────────────┘  └──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   NEXT.JS API ROUTES          │
                    │  (Server-side operations)     │
                    └───────────────┬───────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │ Payments API │        │ Shipments API│        │ Webhooks API │
   │  (Razorpay)  │        │  (FSHiP)     │        │  (FSHiP)     │
   └──────────────┘        └──────────────┘        └──────────────┘
         │                          │                          │
         │                  ┌───────┴─────────┐                │
         │                  │                 │                │
         ▼                  ▼                 ▼                ▼
   ┌─────────────────────────────────────────────────────────────┐
   │              CORE BACKEND SERVICES LAYER                    │
   ├─────────────────────────────────────────────────────────────┤
   │ • OrderService (create, update, cancel)                    │
   │ • ShipmentService (FSHiP integration, retry logic)         │
   │ • WebhookService (status updates, event logging)           │
   │ • CacheService (Redis - tokens, rate limits)               │
   │ • ErrorHandlingService (DLQ processing, retries)           │
   └──────────────────┬──────────────────────────────────────────┘
                      │
     ┌────────────────┼────────────────┐
     │                │                │
     ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │    FSHiP     │
│   (Core DB)  │  │   (Cache &   │  │   (3rd Party)│
│              │  │   Queue)     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Architecture Layers

### 1. **Frontend Layer** (Customer-facing)
- React components for order tracking
- Cart → Checkout → Payment → Order Confirmation
- Real-time shipment status updates via polling/webSockets

### 2. **API Gateway Layer** (Next.js API Routes)
- Entry point for all requests
- Authentication & authorization
- Request validation & rate limiting
- Response serialization

### 3. **Business Logic Layer** (Services)
- Order orchestration
- Shipment creation & management
- Payment verification
- Webhook processing
- Error handling & retries

### 4. **Data Layer** (PostgreSQL + Redis)
- Persistent storage for orders, shipments, customers
- Caching for tokens, configurations, frequently accessed data
- Queue for async job processing

### 5. **External Integration Layer** (FSHiP API)
- Secure authentication
- Shipment lifecycle management
- Webhook handling for status updates

---

## Database Schema

### Core Tables

```sql
-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Customer & Delivery Info
  shipping_name VARCHAR(255) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(20) NOT NULL,
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100) NOT NULL,
  shipping_pincode VARCHAR(10) NOT NULL,
  shipping_country VARCHAR(100) DEFAULT 'India',
  
  -- Billing Info
  billing_address_same_as_shipping BOOLEAN DEFAULT true,
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_phone VARCHAR(20),
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_pincode VARCHAR(10),
  
  -- Order Details
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_charges DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment Info
  payment_method VARCHAR(50) NOT NULL, -- 'RAZORPAY_PREPAID', 'COD'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  
  -- Order Status
  order_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'rto'
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  INDEX idx_customer_id (customer_id),
  INDEX idx_order_number (order_number),
  INDEX idx_order_status (order_status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at)
);

-- Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Product snapshot (for historical reference)
  product_name VARCHAR(255) NOT NULL,
  product_weight VARCHAR(50) NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_order_id (order_id)
);

-- Shipments Table
CREATE TABLE shipments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  
  -- FSHiP Integration
  fship_shipment_id VARCHAR(255) UNIQUE,
  awb_number VARCHAR(255) UNIQUE,
  courier_partner_id VARCHAR(100), -- e.g., FEDEX, BLUEDART, DELHIVERY
  courier_partner_name VARCHAR(255),
  
  -- Shipment Status
  shipment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'created', 'pickup_scheduled', 'picked', 'in_transit', 'delivered', 'rto', 'cancelled'
  
  -- Logistics Details
  weight_kg DECIMAL(8, 3),
  dimensions_length DECIMAL(8, 2),
  dimensions_width DECIMAL(8, 2),
  dimensions_height DECIMAL(8, 2),
  
  -- Tracking
  last_pickup_location VARCHAR(255),
  last_delivery_location VARCHAR(255),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Retry & Error Tracking
  creation_attempts INT DEFAULT 0,
  last_creation_attempt_at TIMESTAMP,
  creation_error_message TEXT,
  is_error BOOLEAN DEFAULT false,
  error_status VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shipped_at TIMESTAMP,
  
  INDEX idx_order_id (order_id),
  INDEX idx_fship_shipment_id (fship_shipment_id),
  INDEX idx_awb_number (awb_number),
  INDEX idx_shipment_status (shipment_status),
  INDEX idx_courier_partner_id (courier_partner_id)
);

-- Shipment Events/Logs Table
CREATE TABLE shipment_events (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- 'pickup_requested', 'picked', 'in_transit', 'delivered', 'rto', 'exception'
  event_status VARCHAR(50) NOT NULL, -- Specific status from FSHiP
  
  -- Webhook Info
  fship_event_id VARCHAR(255) UNIQUE,
  webhook_received_at TIMESTAMP,
  
  -- Location & Timestamp
  location VARCHAR(255),
  event_timestamp TIMESTAMP,
  description TEXT,
  
  -- Webhook Processing
  processed_at TIMESTAMP,
  idempotency_key VARCHAR(255) UNIQUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_shipment_id (shipment_id),
  INDEX idx_event_type (event_type),
  INDEX idx_event_timestamp (event_timestamp),
  INDEX idx_idempotency_key (idempotency_key)
);

-- Courier Configuration Table
CREATE TABLE courier_configs (
  id UUID PRIMARY KEY,
  courier_id VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'FEDEX', 'DELHIVERY'
  courier_name VARCHAR(255) NOT NULL,
  
  -- Pricing & Weight Constraints
  min_weight_kg DECIMAL(8, 3),
  max_weight_kg DECIMAL(8, 3),
  base_rate DECIMAL(10, 2),
  per_kg_rate DECIMAL(10, 2),
  coverage_states JSON, -- List of states this courier operates in
  
  -- API Configuration
  api_key_encoded VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_courier_id (courier_id)
);

-- API Authentication Tokens Cache
CREATE TABLE fship_auth_tokens (
  id UUID PRIMARY KEY,
  token VARCHAR(1000) NOT NULL,
  token_type VARCHAR(50),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_expires_at (expires_at)
);

-- Error/Retry Queue
CREATE TABLE shipment_error_queue (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  error_type VARCHAR(100), -- 'creation_failed', 'pickup_failed', 'webhook_failed'
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 5,
  next_retry_at TIMESTAMP,
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_shipment_id (shipment_id),
  INDEX idx_next_retry_at (next_retry_at),
  INDEX idx_is_resolved (is_resolved)
);
```

---

## API Route Structure

```
app/api/
├── auth/
│   ├── login/ (existing)
│   ├── register/ (existing)
│   └── me/ (existing)
│
├── orders/
│   ├── route.ts (GET all orders, POST create order)
│   └── [id]/
│       ├── route.ts (GET, PUT, DELETE order details)
│       ├── cancel/
│       │   └── route.ts (POST cancel order)
│       └── track/
│           └── route.ts (GET shipment tracking)
│
├── shipments/
│   ├── route.ts (GET shipments list)
│   ├── [id]/
│   │   ├── route.ts (GET shipment details)
│   │   ├── create/
│   │   │   └── route.ts (POST manual shipment creation)
│   │   ├── cancel/
│   │   │   └── route.ts (POST cancel shipment)
│   │   └── track/
│   │       └── route.ts (GET real-time tracking)
│   │
│   └── webhooks/
│       └── fship/
│           └── route.ts (POST webhook handler)
│
├── admin/
│   ├── shipments/
│   │   ├── route.ts (GET shipments for admin)
│   │   ├── [id]/
│   │   │   ├── route.ts (GET/PUT shipment details)
│   │   │   └── create-manual/
│   │   │       └── route.ts (POST create manual shipment)
│   │   └── bulk-create/
│   │       └── route.ts (POST batch shipment creation)
│   │
│   └── couriers/
│       └── route.ts (GET/POST courier configs)
│
└── internal/
    ├── shipments/
    │   ├── process-queue/
    │   │   └── route.ts (POST process error queue)
    │   ├── sync-status/
    │   │   └── route.ts (POST sync shipment status)
    │   └── create-multiple/
    │       └── route.ts (POST batch create shipments)
    │
    └── health/
        └── route.ts (GET system health)
```

---

## Integration Flow Diagrams

### Flow 1: Order to Shipment Creation (Automatic - After Payment)

```
Customer Completes Payment (Razorpay)
                  │
                  ▼
    Razorpay Webhook → /api/payments/verify
                  │
                  ▼
        Update Order (payment_status = 'completed')
        Emit Event: ORDER_PAID
                  │
                  ▼
    Order Service: confirmOrder()
    - Update order_status = 'confirmed'
    - Push to Queue for shipment creation
                  │
                  ▼
    Background Job: createShipment()
    (Async with retry)
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    Success            Failure
        │                   │
        ▼                   ▼
    Call FSHiP API       Push to ERROR_QUEUE
    - Get couriers        - Retry with exponential
    - Create shipment       backoff (1s, 2s, 4s...)
    - Generate AWB
    - Schedule pickup
        │
        ▼
    Update Shipment Table
    - fship_shipment_id
    - awb_number
    - courier_partner
    - shipment_status = 'created'
        │
        ▼
    Send Customer Notification
    Email + SMS: AWB, Tracking Link
```

### Flow 2: Manual Shipment Creation (Admin Dashboard)

```
Admin Dashboard
       │
       ▼
Admin clicks "Create Shipment"
Select Order & Courier
       │
       ▼
POST /api/admin/shipments/[id]/create-manual
       │
       ├─ Authenticate (Admin role required)
       ├─ Validate order eligible for shipment
       ├─ Calculate weight & dimensions from order items
       │
       ▼
Call FSHiP API (with retry logic)
       │
┌──────┴──────┐
│             │
▼             ▼
Success    Failure
│             │
│             ├─ Store error in shipment_error_queue
│             ├─ Notify admin: "Shipment creation failed"
│             └─ Show retry option
│
▼
Store in Shipments table
- fship_shipment_id
- awb_number
- courier_partner_id
- shipment_status = 'created'
│
▼
Notify Customer via Email/SMS
│
▼
Admin dashboard shows: Shipment created ✓
```

### Flow 3: Webhook Status Update (FSHiP → Your System)

```
FSHiP Event Occurs
(e.g., Shipment picked, in-transit, delivered)
            │
            ▼
FSHiP sends HTTP POST to /api/shipments/webhooks/fship
Signature included in header: X-FSHiP-Signature
            │
            ▼
WebhookService.handleFshipWebhook()
            │
    ┌───────┴─────────┐
    │                 │
    ▼                 ▼
Verify Signature   Invalid
    │                 │
    │                 ▼
    │         Return 401 Unauthorized
    │         Log Security Alert
    │
    ▼
Check Idempotency (idempotency_key in Redis)
    │
    ├─ Already processed? → Return 200 (already handled)
    │
    ▼
Store event in shipment_events table
    │
    ▼
Update Shipment status
    │
    ▼
Update Order status (if delivered/rto)
    │
    ▼
Update customer in real-time
(WebSocket or next poll)
    │
    ▼
Log event to shipment_events
    │
    ▼
Mark idempotency as processed (Redis)
    │
    ▼
Return 200 OK to FSHiP
```

---

## Error Handling & Retry Strategy

### Failure Scenarios

| Scenario | Status | Retry Strategy | Max Retries |
|----------|--------|-----------------|-------------|
| FSHiP API timeout | 504 | Exponential backoff (1s, 2s, 4s, 8s...) | 5 |
| Invalid address | 400 | Manual intervention required | N/A |
| Courier unavailable | 503 | Exponential backoff, try next courier | 3 |
| Webhook signature mismatch | Security | Alert admin, log incident | N/A |
| Webhook idempotent duplicate | Logic | Return 200 (already processed) | N/A |
| Payment verification fails | Business | Notify customer, don't create shipment | N/A |

### Error Queue Processing

```
Shipment Creation Fails
        │
        ▼
Entry added to shipment_error_queue
- error_type: 'creation_failed'
- error_message: 'ECONNREFUSED: Connection refused'
- retry_count: 0
- next_retry_at: NOW + 1s
        │
        ▼
Background Job runs every 30s
Check for records with:
- next_retry_at <= NOW
- is_resolved = false
- retry_count < max_retries
        │
        ▼
Retry createShipment()
        │
    ┌───┴───┐
    │       │
    ▼       ▼
Success Failure (again)
    │       │
    ▼       ▼
Remove  Increment retry_count
from    Set next_retry_at = NOW + (2^retry_count)s
queue   
        If retry_count >= max_retries:
        - Mark as error: is_resolved = true
        - Set error_status = 'MANUAL_INTERVENTION_REQUIRED'
        - Notify admin via dashboard
```

---

## Security Considerations

### 1. **Authentication & Authorization**
- All shipment endpoints require JWT token
- Admin endpoints require `role === 'ADMIN'`
- Customer can only view/track their own orders

### 2. **Webhook Verification**
```javascript
// FSHiP sends webhook with signature
// X-FSHiP-Signature: HMAC-SHA256 (payload, SECRET_KEY)

function verifyWebhookSignature(payload, receivedSignature) {
  const calculatedSignature = crypto
    .createHmac('sha256', process.env.FSHIP_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(calculatedSignature)
  );
}
```

### 3. **Token Management**
- FSHiP tokens stored encrypted in `fship_auth_tokens` table
- Cached in Redis with TTL 1 hour before token expiry
- Never expose tokens in API responses or logs

### 4. **Rate Limiting**
- Redis-based rate limiting: 100 requests/min per API key
- FSHiP API calls rate-limited to respect their quotas

### 5. **Data Validation**
- Address validation using FSHIP pincode service
- Phone number validation (10-digit Indian format)
- Weight/dimension validation against courier limits

---

## Caching Strategy (Redis)

### Keys Structure

```
# FSHiP Authentication
fship:auth:token → JSON { token, type, expires_at }
[TTL: 1 hour before expiry]

# Rate Limiting
rate_limit:api:{api_key}:{endpoint} → counter
[TTL: 60 seconds]

# Webhook Idempotency
webhook:idempotency:{webhook_id} → processed_timestamp
[TTL: 24 hours]

# Courier Configuration Cache
courier:config:{courier_id} → JSON { min_weight, max_weight, ... }
[TTL: 7 days]

# Order Tracking (Real-time)
order:track:{order_id} → JSON { status, awb, last_update }
[TTL: 30 minutes]

# Background Job Queue
job:queue:{job_type} → Redis List (FIFO)
[No TTL, manually popped]
```

---

## Scaling Considerations

### For 10,000+ Concurrent Users

1. **Database**
   - PostgreSQL with read replicas for tracking queries
   - Indexes on `order_id`, `shipment_status`, `customer_id`
   - Partitioning on `created_at` for large tables

2. **Redis**
   - Cluster setup for distributed caching
   - Sentinel for failover

3. **Background Jobs**
   - Use Bull or similar queue library
   - Multiple worker processes for retry queue
   - Polling interval: 30s (configurable)

4. **API Scaling**
   - Next.js on Vercel auto-scales
   - Rate limiting prevents abuse
   - Webhooks processed asynchronously

5. **CDN**
   - Tracking page served from CDN
   - Minimal DB queries

---

## Deployment Checklist

- [ ] FSHiP API credentials in `.env.local`
- [ ] Webhook URL registered in FSHiP dashboard
- [ ] Database migrations run
- [ ] Redis connection tested
- [ ] Webhook signature secret configured
- [ ] Admin user created with ADMIN role
- [ ] Background job worker running
- [ ] Monitoring & alerting setup (Sentry, DataDog)
- [ ] SSL/TLS certificates valid
- [ ] Backup strategy implemented

