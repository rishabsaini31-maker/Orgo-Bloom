// prisma/shipping-schema.prisma
// Add these models to your existing schema.prisma file

model Order {
id String @id @default(cuid())
orderNumber String @unique
customerId String
customer User @relation(fields: [customerId], references: [id])

// Customer & Delivery Info
shippingName String
shippingEmail String
shippingPhone String
shippingAddressLine1 String
shippingAddressLine2 String?
shippingCity String
shippingState String
shippingPincode String
shippingCountry String @default("India")

// Billing Info
billingAddressSameAsShipping Boolean @default(true)
billingName String?
billingEmail String?
billingPhone String?
billingAddressLine1 String?
billingAddressLine2 String?
billingCity String?
billingState String?
billingPincode String?

// Order Details
subtotal Float
shippingCharges Float @default(0)
tax Float @default(0)
discount Float @default(0)
totalAmount Float

// Payment Info
paymentMethod String // 'RAZORPAY_PREPAID', 'COD'
paymentStatus String @default("pending") // 'pending', 'completed', 'failed'
razorpayOrderId String?
razorpayPaymentId String?

// Order Status
orderStatus String @default("pending") // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'rto'
notes String?

// Relations
items OrderItem[]
shipment Shipment?

// Timestamps
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
cancelledAt DateTime?

@@index([customerId])
@@index([orderNumber])
@@index([orderStatus])
@@index([paymentStatus])
@@index([createdAt])
}

model OrderItem {
id String @id @default(cuid())
orderId String
order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

productId String
product Product @relation(fields: [productId], references: [id])

quantity Int @default(1)
unitPrice Float
totalPrice Float

// Product snapshot (for historical reference)
productName String
productWeight String

createdAt DateTime @default(now())

@@index([orderId])
@@index([productId])
}

model Shipment {
id String @id @default(cuid())
orderId String @unique
order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

// FSHiP Integration
fshipShipmentId String? @unique
awbNumber String? @unique
courierPartnerId String? // e.g., 'FEDEX', 'BLUEDART', 'DELHIVERY'
courierPartnerName String?

// Shipment Status
shipmentStatus String @default("pending") // 'pending', 'created', 'pickup_scheduled', 'picked', 'in_transit', 'delivered', 'rto', 'cancelled'

// Logistics Details
weightKg Float?
dimensionsLength Float?
dimensionsWidth Float?
dimensionsHeight Float?

// Tracking
lastPickupLocation String?
lastDeliveryLocation String?
expectedDeliveryDate DateTime?
actualDeliveryDate DateTime?

// Retry & Error Tracking
creationAttempts Int @default(0)
lastCreationAttemptAt DateTime?
creationErrorMessage String?
isError Boolean @default(false)
errorStatus String?

// Relations
events ShipmentEvent[]
errorQueue ShipmentErrorQueue?

// Timestamps
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
shippedAt DateTime?

@@index([orderId])
@@index([fshipShipmentId])
@@index([awbNumber])
@@index([shipmentStatus])
@@index([courierPartnerId])
}

model ShipmentEvent {
id String @id @default(cuid())
shipmentId String
shipment Shipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)

// Event Details
eventType String // 'pickup_requested', 'picked', 'in_transit', 'delivered', 'rto', 'exception'
eventStatus String // Specific status from FSHiP

// Webhook Info
fshipEventId String? @unique
webhookReceivedAt DateTime?

// Location & Timestamp
location String?
eventTimestamp DateTime?
description String?

// Webhook Processing
processedAt DateTime?
idempotencyKey String? @unique

createdAt DateTime @default(now())

@@index([shipmentId])
@@index([eventType])
@@index([eventTimestamp])
@@index([idempotencyKey])
}

model CourierConfig {
id String @id @default(cuid())
courierId String @unique // e.g., 'FEDEX', 'DELHIVERY'
courierName String

// Pricing & Weight Constraints
minWeightKg Float?
maxWeightKg Float?
baseRate Float?
perKgRate Float?
coverageStates String? // JSON stored as text

// API Configuration
apiKeyEncoded String?
isActive Boolean @default(true)

createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

@@index([courierId])
}

model FshipAuthToken {
id String @id @default(cuid())
token String
tokenType String?
expiresAt DateTime

createdAt DateTime @default(now())

@@index([expiresAt])
}

model ShipmentErrorQueue {
id String @id @default(cuid())
shipmentId String @unique
shipment Shipment? @relation(fields: [shipmentId], references: [id])

// Error Details
errorType String // 'creation_failed', 'pickup_failed', 'webhook_failed'
errorMessage String?

// Retry Logic
retryCount Int @default(0)
maxRetries Int @default(5)
nextRetryAt DateTime?

// Resolution
isResolved Boolean @default(false)
resolutionNotes String?

createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

@@index([shipmentId])
@@index([nextRetryAt])
@@index([isResolved])
}

// Update existing Product model to include order items relation
// Add this to your Product model if not already present:
// orderItems OrderItem[]
