# FSHiP Shipping Architecture - Complete Documentation Index

## Overview

This is a production-ready shipping architecture design for the Orgobloom e-commerce platform (organic fertilizer shop) integrating with FSHiP as the primary logistics provider.

**Architecture Type**: Microservices-oriented, event-driven, highly scalable  
**Deployment Target**: Vercel (Next.js)  
**Database**: PostgreSQL (Neon)  
**Cache**: Redis  
**Designed for**: 10,000+ concurrent users, 1000+ shipments/minute

---

## Documentation Structure

### 1. **SHIPPING_ARCHITECTURE.md** - High-Level Design
**Read this first for:**
- System overview and architecture diagram
- Database schema design
- API route structure
- Integration flow diagrams
- Error handling & retry strategy
- Security considerations
- Caching strategy
- Scaling considerations
- Deployment checklist

**Key Sections:**
```
├─ System Overview
├─ Architecture Layers (5 layers)
├─ Database Schema (SQL + ERD)
├─ API Route Structure
├─ Integration Flow (3 major flows)
├─ Error Handling (5 failure scenarios)
├─ Security (5 key areas)
├─ Cache Strategy (Redis keys)
└─ Scaling for 10K users
```

---

### 2. **SHIPPING_PRISMA_SCHEMA.md** - Data Models
**Use this to:**
- Implement database models in Prisma
- Understand data relationships
- Create migrations
- Update existing schema

**Models Defined:**
```
├─ Order
├─ OrderItem
├─ Shipment
├─ ShipmentEvent
├─ CourierConfig
├─ FshipAuthToken
└─ ShipmentErrorQueue
```

**Quick Copy-Paste**: All Prisma models ready to add to your schema.prisma

---

### 3. **SHIPPING_SERVICES_IMPLEMENTATION.md** - Business Logic
**Implement using this guide:**
- FshipApiClient (authentication, shipment creation, tracking, cancellation)
- OrderService (create, confirm, cancel orders)
- ShipmentService (create with retry, get tracking, process error queue)
- WebhookService (handle FSHiP events with idempotency)
- Rate limiting middleware
- Background job processor

**4 Core Services:**
```
FshipApiClient
├─ getAuthToken() [cached in Redis]
├─ createShipment()
├─ getTracking()
├─ cancelShipment()
└─ verifyWebhookSignature()

OrderService
├─ createOrder()
├─ confirmOrder() [queues shipment creation]
└─ cancelOrder()

ShipmentService
├─ createShipment() [with exponential backoff]
├─ getTracking()
├─ processErrorQueue()
└─ extractWeight()

WebhookService
├─ handleFshipWebhook()
├─ mapEventType()
└─ mapShipmentStatus()
```

**TypeScript Code**: Production-ready implementations with error handling

---

### 4. **SHIPPING_API_ROUTES.md** - Endpoint Specifications
**Build API routes from:**
- POST /api/orders (create order)
- POST /api/admin/shipments/[id]/create-manual (admin shipment creation)
- POST /api/shipments/webhooks/fship (webhook handler)
- GET /api/orders/[id]/track (customer tracking)
- POST /api/admin/shipments/bulk-create (bulk operations)
- POST /api/internal/shipments/process-queue (background job)

**For Each Route:**
```
├─ Authentication requirements
├─ Authorization checks
├─ Rate limiting strategy
├─ Input validation
├─ Error handling
├─ Response format
└─ Code example
```

**Complete Request/Response Examples**: JSON payloads for all endpoints

---

### 5. **SHIPPING_DEPLOYMENT_GUIDE.md** - Production Operations
**Deploy and maintain using:**
- Pre-deployment checklist
- Step-by-step deployment instructions
- Performance optimization techniques
- Scaling architecture (10K+ users)
- Monitoring & alerting setup
- Backup & disaster recovery
- Security hardening
- Incident response playbook

**Key Topics:**
```
├─ Deployment (Vercel, FSHiP webhook registration)
├─ Performance (DB optimization, Redis pooling, caching)
├─ Scaling (DB partitioning, Redis cluster, load testing)
├─ Monitoring (metrics to track, alert rules)
├─ Backup (PostgreSQL, Redis backup strategy)
├─ Failover (FSHiP down, Redis down, DB down)
├─ Security (input validation, SQL injection prevention, rate limiting, JWT)
├─ Logging (structured logging, webhook debugging)
├─ Cost optimization (FSHiP discounts, infrastructure reduction)
└─ Incident Response (playbooks for common issues)
```

---

### 6. **SHIPPING_QUICK_REFERENCE.md** - Implementation Guide
**Use for:**
- System overview diagram
- 8-week implementation roadmap (with weekly deliverables)
- Technology stack summary
- Configuration file templates
- Data flow examples (with code)
- Testing strategy (unit, integration, E2E)
- Troubleshooting guide
- Performance benchmarks
- Maintenance tasks

**Most Useful For:**
- Developers starting implementation
- Project managers tracking progress
- Debugging specific issues
- Understanding data flow

---

## Quick Start Checklist

### Phase 1: Planning (Week 1)
- [ ] Read SHIPPING_ARCHITECTURE.md for overview
- [ ] Review SHIPPING_QUICK_REFERENCE.md timeline
- [ ] Get FSHiP API credentials
- [ ] Set up PostgreSQL and Redis
- [ ] Create team wiki with docs

### Phase 2: Setup (Week 1-2)
- [ ] Add SHIPPING_PRISMA_SCHEMA.md models to Prisma
- [ ] Run `npx prisma migrate dev`
- [ ] Set up Redis connection
- [ ] Configure environment variables
- [ ] Create admin user with ADMIN role

### Phase 3: Implementation (Week 3-5)
- [ ] Implement services from SHIPPING_SERVICES_IMPLEMENTATION.md
- [ ] Build API routes from SHIPPING_API_ROUTES.md
- [ ] Write unit tests
- [ ] Set up webhook receiver

### Phase 4: Testing (Week 6-7)
- [ ] Integration testing
- [ ] FSHiP sandbox testing
- [ ] Load testing
- [ ] Security audit

### Phase 5: Deployment (Week 8)
- [ ] Follow SHIPPING_DEPLOYMENT_GUIDE.md
- [ ] Register webhooks with FSHiP
- [ ] Set up monitoring & alerting
- [ ] Go live!

---

## Architecture Decision Records (ADR)

### 1. Why Vercel + Next.js?
- Auto-scaling serverless functions
- Built-in API routes
- Automatic deployments from Git
- Global CDN
- No server management
- Perfect for medium-scale e-commerce

### 2. Why PostgreSQL?
- ACID compliance for financial transactions
- Strong consistency guarantees
- Excellent for complex queries
- Native JSON support for flexibility
- Neon offers managed PostgreSQL

### 3. Why Redis for caching?
- Sub-millisecond response times
- Native data structures (strings, lists, hashes)
- Built-in TTL & expiration
- Perfect for rate limiting
- Excellent for idempotency keys

### 4. Why FSHiP?
- Comprehensive Indian courier network
- Webhook-based real-time updates
- Rate limiting: 100 requests/min (acceptable)
- REST API (easy integration)
- Supports COD & Prepaid

### 5. Why exponential backoff for retries?
- Prevents API overload during outages
- Reduces retry storm effect
- Industry standard pattern
- Easy to configure (max 5 retries = 31 seconds max wait)

### 6. Why webhook idempotency?
- Prevents duplicate events from being processed
- Handles network retries gracefully
- Essential for accurate order status
- Redis cache provides distributed idempotency

### 7. Why separate error queue?
- Allows retries without blocking main flow
- Provides visibility into failures
- Enables manual intervention
- Decouples retry logic from creation logic

---

## Data Flow Summary

### Order to Delivery Journey

```
Customer Checkout
    ↓
Order Created (pending)
    ↓
Payment Processing
    ↓
Razorpay Webhook → Order Paid
    ↓
Job Queued: Create Shipment
    ↓
Shipment Service (with retries)
    ↓
FSHiP API Call
    ↓
Success: AWB Generated, Order Shipped
    ↓
FSHiP Webhooks (Real-time updates)
├─ Picked
├─ In-Transit
├─ Out for Delivery
└─ Delivered
    ↓
Order Marked Delivered
    ↓
Customer Notification (Email/SMS)
    ↓
End State: Delivered
```

---

## Key Files to Implement

### 1. Configuration
```
.env.production          → All secrets and API keys
vercel.json             → Cron job schedule
prisma/schema.prisma    → Database models (extend existing)
```

### 2. Services
```
lib/fship-client.ts              → FSHiP API integration
lib/services/order-service.ts    → Order business logic
lib/services/shipment-service.ts → Shipment business logic
lib/services/webhook-service.ts  → Webhook processing
lib/middleware/rate-limit.ts     → Rate limiting
```

### 3. API Routes
```
app/api/orders/route.ts                        → Create order
app/api/orders/[id]/track/route.ts             → Track order
app/api/admin/shipments/[id]/create-manual/    → Manual shipment
app/api/admin/shipments/bulk-create/           → Bulk shipment
app/api/shipments/webhooks/fship/route.ts      → Webhook handler
app/api/internal/shipments/process-queue/      → Error queue processor
```

### 4. Database
```
prisma/migrations/*/migration.sql   → Migration files
Scripts to seed courier configs
Scripts for initial data import
```

---

## Testing Recommendations

### Unit Tests
- Test each service independently
- Mock FSHiP API responses
- Test error handling & retries
- Test webhook signature verification

### Integration Tests
- Test full order-to-shipment flow
- Test webhook event processing
- Test Redis interactions
- Test database transactions

### Load Tests
- 1000 concurrent orders
- Expect <200ms p95 latency
- Monitor error rate (<1%)
- Check memory usage

---

## Monitoring Essentials

### Metrics (Track These)
1. **Shipment Creation**
   - Success rate (target: >99%)
   - Average time to create (target: <2s)
   - Retry attempts (track distribution)

2. **FSHiP API**
   - Response times
   - Error rates (401, 503, etc)
   - Token refresh frequency

3. **Webhooks**
   - Events received per minute
   - Processing latency
   - Signature verification failures

4. **Database**
   - Connection pool utilization
   - Query latency (p95, p99)
   - Error counts

5. **Error Queue**
   - Queue size over time
   - Retry success rate
   - Manual interventions needed

### Alerts (Set These Up)
- Shipment creation failure rate > 5%
- Webhook signature mismatches > 10/hour
- Error queue size > 500
- FSHiP API down for > 5 minutes
- Database connection pool > 90%

---

## Support Decision Tree

**Issue**: Shipments not creating
1. Check error queue: `SELECT COUNT(*) FROM shipment_error_queue WHERE is_resolved = false`
2. If high: Check FSHiP API status
3. Check auth token: `SELECT * FROM fship_auth_tokens ORDER BY expires_at DESC LIMIT 1`
4. View errors: `SELECT error_message FROM shipment_error_queue WHERE is_resolved = false LIMIT 5`

**Issue**: Webhook signature failures
1. Verify FSHIP_WEBHOOK_SECRET matches FSHiP dashboard
2. Check webhook logs: `SELECT * FROM webhook_log WHERE signature_valid = false ORDER BY received_at DESC`
3. Test manually: Use FSHiP dashboard webhook tester

**Issue**: Orders stuck in shipped
1. Check if shipment exists: `SELECT * FROM shipments WHERE order_id = 'xxx'`
2. Check for webhook events: `SELECT * FROM shipment_events WHERE shipment_id = 'xxx'`
3. Look for processing errors in logs

**Issue**: High error queue
1. Check what's failing: `SELECT error_type, COUNT(*) FROM shipment_error_queue GROUP BY error_type`
2. Analyze patterns
3. Trigger manual retry if safe: `POST /api/internal/shipments/process-queue`

---

## Glossary

| Term | Definition |
|------|-----------|
| AWB | Air Waybill Number (unique shipment tracking number) |
| COD | Cash on Delivery (collect payment at delivery) |
| RTO | Return to Origin (failed delivery, package returns) |
| Idempotency | Processing a request twice produces same result as once |
| Exponential Backoff | Retry delay increases exponentially (1s, 2s, 4s, 8s) |
| Webhook | Real-time callback from external service |

---

## Document Versions

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-02-07 | Initial comprehensive design |

---

## Contact & Questions

For questions about this architecture:
- Review the relevant documentation file above
- Check SHIPPING_QUICK_REFERENCE.md troubleshooting section
- Review incident response playbooks in SHIPPING_DEPLOYMENT_GUIDE.md

---

## Next Steps

1. **Start here**: Read SHIPPING_ARCHITECTURE.md (30 min)
2. **Plan timeline**: Review SHIPPING_QUICK_REFERENCE.md (15 min)
3. **Set up DB**: Use SHIPPING_PRISMA_SCHEMA.md (1 hour)
4. **Code services**: Follow SHIPPING_SERVICES_IMPLEMENTATION.md (2-3 hours)
5. **Build routes**: Implement from SHIPPING_API_ROUTES.md (2-3 hours)
6. **Test**: Write tests and run integration tests (2 hours)
7. **Deploy**: Follow SHIPPING_DEPLOYMENT_GUIDE.md (30 min)

**Total Implementation Time**: 8 weeks with 1 developer, 4-5 weeks with 2 developers

---

## License & Usage

This architecture design is provided as-is for the Orgobloom e-commerce platform. You are free to:
- ✅ Modify for your specific needs
- ✅ Share within your organization
- ✅ Reference in documentation

Please do not:
- ❌ Claim as original work
- ❌ Publish without attribution
- ❌ Use FSHiP credentials in public repositories

---

**Document Last Updated**: February 7, 2024  
**Architecture Version**: 1.0 (Production Ready)  
**Compatibility**: Next.js 14+, Prisma 5+, Node.js 18+

