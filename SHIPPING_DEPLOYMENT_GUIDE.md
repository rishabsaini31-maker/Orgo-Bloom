# FSHiP Shipping Integration: Deployment & Best Practices

## Pre-Deployment Checklist

### Environment Setup

- [ ] FSHiP API credentials obtained (ClientID, ClientSecret)
- [ ] Webhook URL registered in FSHiP dashboard
- [ ] Webhook secret configured (FSHIP_WEBHOOK_SECRET)
- [ ] Redis instance running (self-hosted or managed service like Redis Cloud)
- [ ] PostgreSQL database configured
- [ ] Sentry/Error tracking configured for production monitoring
- [ ] All environment variables added to Vercel/deployment platform

### Database Prerequisites

```bash
# Run migrations
npx prisma migrate deploy

# Seed courier configurations
npx ts-node scripts/seed-couriers.ts
```

### Security Verification

- [ ] All API keys encrypted or stored in environment variables
- [ ] Webhook signature verification implemented and tested
- [ ] Admin endpoints protected with role-based access control
- [ ] Rate limiting enabled on public endpoints
- [ ] CORS properly configured to prevent unauthorized access
- [ ] SSL/TLS certificates valid and auto-renewing
- [ ] No API keys logged in console or error messages

---

## Deployment Steps

### 1. Vercel Deployment

```bash
# Add environment variables to Vercel project
vercel env add FSHIP_CLIENT_ID
vercel env add FSHIP_CLIENT_SECRET
vercel env add FSHIP_WEBHOOK_SECRET
vercel env add REDIS_URL
vercel env add INTERNAL_API_TOKEN

# Deploy
git push origin main  # Vercel auto-deploys on push
```

### 2. Register Webhook URL with FSHiP

1. Log into FSHiP dashboard
2. Navigate to Webhooks/Integration settings
3. Register webhook URL: `https://yourdomain.vercel.app/api/shipments/webhooks/fship`
4. Copy webhook secret and add to `.env.production` (already done as FSHIP_WEBHOOK_SECRET)
5. Test webhook delivery from FSHiP dashboard

### 3. Configure Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/internal/shipments/process-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### 4. Set up Monitoring

```typescript
// lib/monitoring.ts

import * as Sentry from "@sentry/nextjs";

export function initMonitoring() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

// Use in API routes
export function captureException(error: Error, context: any) {
  Sentry.captureException(error, {
    extra: context
  });
}
```

---

## Performance Optimization

### 1. Database Query Optimization

```typescript
// Use include selectively to avoid N+1 queries
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    items: {
      include: {
        product: true
      }
    },
    shipment: {
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10  // Only recent events
        }
      }
    }
  }
});

// Add indexes on frequently queried fields
CREATE INDEX idx_order_customer_status 
ON orders(customer_id, order_status);

CREATE INDEX idx_shipment_awb 
ON shipments(awb_number);
```

### 2. Redis Connection Pooling

```typescript
// Use connection pool for better performance
import Redis from 'ioredis';

// Single instance (connections are pooled internally)
export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
  // Implement fallback or alerting
});
```

### 3. Caching Strategy

```typescript
// Cache frequently accessed data
export async function getCachedCourierConfig(courierId: string) {
  const cacheKey = `courier:config:${courierId}`;
  
  let config = await redis.get(cacheKey);
  if (config) return JSON.parse(config);
  
  config = await prisma.courierConfig.findUnique({
    where: { courierId }
  });
  
  // Cache for 7 days
  await redis.setex(cacheKey, 604800, JSON.stringify(config));
  
  return config;
}
```

### 4. Batch Operations

```typescript
// For bulk shipment creation, process in batches
async function createShipmentsInBatches(orderIds: string[], batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < orderIds.length; i += batchSize) {
    const batch = orderIds.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(orderId => 
        shipmentService.createShipment(orderId)
          .catch(error => ({ error, orderId }))
      )
    );
    
    results.push(...batchResults);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
```

---

## Scaling Architecture (10,000+ Users)

### Database Scaling

```sql
-- Partitioning on orders table (by date)
CREATE TABLE orders_2024_01 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Read replica for analytics
-- Configure PostgreSQL replication
-- Use read replica for:
-- - Customer tracking queries
-- - Admin analytics
-- - Reporting endpoints
```

### Redis Cluster Setup

```typescript
// For high traffic, use Redis Cluster
import Redis from 'ioredis';

const redis = new Redis.Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 }
], {
  maxRedirections: 16,
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 300
});
```

### Load Testing Results (Expected)

For organic fertilizer e-commerce with FSHiP:

| Metric | Expected | Configuration |
|--------|----------|----------------|
| Concurrent Users | 10,000+ | Vercel Auto-scaling |
| API Response Time (p95) | <200ms | Cached responses |
| Shipment Creation Rate | 1000/min | With retries |
| Webhook Processing | <100ms | Async with idempotency |
| Database Connections | <100 | Connection pooling |

---

## Monitoring & Alerting

### Key Metrics to Monitor

```typescript
// Using custom event tracking
import { captureException } from '@/lib/monitoring';

// 1. Shipment Creation Success Rate
export async function trackShipmentCreation(success: boolean, duration: number) {
  await sendMetric('shipment_creation', {
    success,
    duration_ms: duration,
    timestamp: new Date()
  });
}

// 2. FSHiP API Response Times
export async function trackFshipApiCall(endpoint: string, duration: number, status: number) {
  await sendMetric('fship_api_call', {
    endpoint,
    duration_ms: duration,
    status_code: status
  });
}

// 3. Webhook Processing
export async function trackWebhookProcessing(eventType: string, duration: number, success: boolean) {
  await sendMetric('webhook_processing', {
    event_type: eventType,
    duration_ms: duration,
    success
  });
}

// 4. Error Queue Size
export async function monitorErrorQueue() {
  const queueSize = await prisma.shipmentErrorQueue.count({
    where: { isResolved: false }
  });
  
  if (queueSize > 100) {
    captureException(
      new Error('Error queue exceeds threshold'),
      { queue_size: queueSize }
    );
  }
}
```

### Alert Conditions

```typescript
// Critical alerts
const alertRules = [
  {
    name: 'High FSHiP API Failure Rate',
    condition: 'error_rate > 5%',
    action: 'page_oncall'
  },
  {
    name: 'Webhook Signature Verification Failures',
    condition: 'failed_verifications > 10/hour',
    action: 'page_oncall'
  },
  {
    name: 'Error Queue Grows Uncontrolled',
    condition: 'error_queue_size > 500',
    action: 'email_admin'
  },
  {
    name: 'Redis Connection Pool Exhausted',
    condition: 'redis_pool_utilization > 90%',
    action: 'page_oncall'
  },
  {
    name: 'Database Connection Limit Reached',
    condition: 'db_connections > max_allowed',
    action: 'page_oncall'
  }
];
```

---

## Disaster Recovery & Failover

### Backup Strategy

```bash
# Daily PostgreSQL backup
pg_dump -h neon.tech -U user -d database | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://backups/orgobloom/

# Redis backup (AOF enabled in production)
# Configuration: appendonly yes
```

### Failover Procedures

#### FSHiP API Down

```typescript
// If FSHiP is down, queue shipments for retry
export async function handleFshipDowntime() {
  const failedShipments = await prisma.shipment.findMany({
    where: {
      shipmentStatus: 'pending',
      creationAttempts: { gt: 0 },
      isError: true
    }
  });
  
  for (const shipment of failedShipments) {
    // Increase next retry time
    await prisma.shipmentErrorQueue.updateMany({
      where: { shipmentId: shipment.id },
      data: {
        nextRetryAt: new Date(Date.now() + 15 * 60000) // 15 min retry
      }
    });
  }
  
  // Alert admin
  await notifyAdmins({
    subject: 'FSHiP API Outage - Manual Intervention May Be Needed',
    body: `${failedShipments.length} shipments pending retry`
  });
}
```

#### Redis Down

```typescript
// Graceful degradation when Redis unavailable
export async function getCachedDataWithFallback(key: string, dbQuery: () => any) {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (redisError) {
    console.warn('Redis unavailable, using database fallback:', redisError);
  }
  
  return dbQuery();
}
```

#### Database Down

```typescript
// Circuit breaker pattern
let dbDown = false;
let lastDbCheckTime = Date.now();

export async function checkDatabaseHealth() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    if (dbDown) {
      console.log('Database recovered');
      dbDown = false;
    }
  } catch (error) {
    dbDown = true;
    console.error('Database health check failed:', error);
    
    // Return 503 Service Unavailable
    return false;
  }
}

// In API routes:
if (dbDown) {
  return NextResponse.json(
    { error: 'Service temporarily unavailable' },
    { status: 503 }
  );
}
```

---

## Security Hardening

### 1. Input Validation

```typescript
// Always validate and sanitize inputs
import { z } from 'zod';

const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  shippingAddress: z.object({
    name: z.string().min(2).max(255),
    email: z.string().email(),
    phone: z.string().regex(/^[6-9]\d{9}$/), // Indian phone format
    pincode: z.string().regex(/^\d{6}$/) // Indian pincode format
  })
});

// Usage
const validated = createShipmentSchema.parse(requestBody);
```

### 2. SQL Injection Prevention

```typescript
// Always use parameterized queries/ORM
// ✅ Good - Using Prisma
const order = await prisma.order.findUnique({
  where: { id: orderId }
});

// ❌ Bad - Never do this
const order = await prisma.$queryRaw`SELECT * FROM orders WHERE id = ${orderId}`;
```

### 3. Rate Limiting

```typescript
// Implement stricter rate limits for sensitive operations
const rateLimits = {
  'POST /api/orders': { limit: 10, window: 60 },
  'POST /api/admin/shipments': { limit: 100, window: 60 },
  'POST /api/shipments/webhooks/fship': { limit: 1000, window: 60 },
  'GET /api/orders': { limit: 100, window: 60 }
};

// Use Redis for distributed rate limiting
export async function enforceRateLimit(endpoint: string, clientId: string) {
  const limit = rateLimits[endpoint];
  if (!limit) return true;
  
  const key = `rate:${endpoint}:${clientId}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, limit.window);
  }
  
  return count <= limit.limit;
}
```

### 4. JWT Token Security

```typescript
// Use short-lived tokens with refresh mechanism
export function generateToken(user: User, expiresIn = '15m') {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn, algorithm: 'HS256' }
  );
}

// Verify token with proper error handling
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired - please refresh');
    }
    throw new Error('Invalid token');
  }
}
```

---

## Logging & Debugging

### Structured Logging

```typescript
// Use structured logging for better debugging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname'
    }
  }
});

// Log shipment creation
logger.info({
  event: 'shipment_created',
  orderId,
  fshipShipmentId,
  awbNumber,
  courierPartner,
  duration_ms
});

// Log errors with context
logger.error({
  event: 'shipment_creation_failed',
  orderId,
  attempt,
  error: error.message,
  stack: error.stack
});
```

### Debugging Webhooks

```typescript
// Log all webhook events for debugging
export async function logWebhookEvent(payload: any, signature: string, isValid: boolean) {
  await prisma.webhookLog.create({
    data: {
      eventId: payload.event_id,
      eventType: payload.event_type,
      payload: JSON.stringify(payload),
      signature,
      signatureValid: isValid,
      receivedAt: new Date(),
      processed: false
    }
  });
}

// Query logs for debugging
// SELECT * FROM webhook_log WHERE event_id = 'xxx' ORDER BY received_at DESC;
```

---

## Cost Optimization

### FSHiP API Costs

- Volume-based discounts: Negotiate based on monthly shipments
- Smart courier selection: Choose cheapest viable courier per shipment
- Weight optimization: Calculate exact weight to minimize charges

### Infrastructure Costs

| Component | Cost | Optimization |
|-----------|------|--------------|
| Vercel (Next.js) | Pay-per-request | No minimum, scales to zero |
| PostgreSQL (Neon) | $0.3/project | Use read replicas for queries |
| Redis | ~$20-100/month | Cache aggressively |
| Bandwidth | Per-GB | Use CDN for static assets |
| Monitoring (Sentry) | ~$29/month | Use custom events for critical paths |

### Cost-Saving Measures

```typescript
// 1. Batch webhook processing
const webhooks = await db.fetchPendingWebhooks(100); // Process in batches
for (const webhook of webhooks) {
  await processWebhook(webhook);
}

// 2. Lazy-load shipment events
const shipment = await db.shipment.findUnique({
  where: { id },
  include: {
    events: {
      take: 5, // Only recent events
      orderBy: { timestamp: 'desc' }
    }
  }
});

// 3. TTL-based data cleanup
await db.shipmentEvent.deleteMany({
  where: {
    createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 days old
  }
});
```

---

## Incident Response Playbook

### Shipment Creation Failures Spike

1. Check FSHiP API status page
2. Review error logs: `SELECT * FROM shipment_error_queue WHERE is_resolved = false`
3. If API issue: Wait for resolution, automatic retries will handle
4. If validation issue: Review recent address patterns, update validation rules
5. Restart error queue processor: `POST /api/internal/shipments/process-queue`

### Webhook Signature Failures

1. Verify FSHIP_WEBHOOK_SECRET is correct
2. Check FSHiP webhook configuration hasn't changed
3. Review security logs for potential tampering
4. Re-register webhook in FSHiP dashboard if needed

### High Error Queue

1. Check `SELECT COUNT(*) FROM shipment_error_queue WHERE is_resolved = false`
2. Analyze error types: `SELECT error_type, COUNT(*) FROM shipment_error_queue GROUP BY error_type`
3. For large queue: Run error processor more frequently or in parallel
4. Alert admins if queue > 500 items

### Payment-to-Shipment Delay

1. Verify cron job running: `SELECT last_execution FROM cron_jobs WHERE name = 'create_shipment_queue'`
2. Check job queue: `LLEN job:queue:create_shipment`
3. Review logs for processing delays
4. If backed up: Trigger manual bulk shipment creation

