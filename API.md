# API Documentation - Orgobloom

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register Customer

**POST** `/auth/register`

Create a new customer account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+91 9876543210"
}
```

**Response:** `201 Created`

```json
{
  "message": "Registration successful",
  "user": {
    "id": "clxxx...",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+91 9876543210",
    "role": "CUSTOMER",
    "createdAt": "2026-02-06T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

**POST** `/auth/login`

Authenticate user and get JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "id": "clxxx...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User

**GET** `/auth/me`

Get authenticated user details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

```json
{
  "user": {
    "id": "clxxx...",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+91 9876543210",
    "role": "CUSTOMER",
    "createdAt": "2026-02-06T10:00:00.000Z"
  }
}
```

---

## Product Endpoints

### Get All Products

**GET** `/products`

Get paginated list of active products.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `search` (optional): Search term
- `featured` (optional): Filter featured products (true/false)

**Response:** `200 OK`

```json
{
  "products": [
    {
      "id": "clxxx...",
      "name": "Premium Cow Manure Fertilizer",
      "slug": "premium-cow-manure-fertilizer",
      "description": "High-quality organic fertilizer...",
      "price": 299.0,
      "weight": "5 kg",
      "stock": 100,
      "imageUrl": "https://...",
      "images": [],
      "benefits": ["100% organic", "Improves soil health"],
      "usage": "Apply to soil before planting...",
      "composition": "Pure cow dung...",
      "isActive": true,
      "isFeatured": true,
      "createdAt": "2026-02-06T10:00:00.000Z",
      "updatedAt": "2026-02-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 25,
    "totalPages": 3
  }
}
```

### Get Product by ID

**GET** `/products/:id`

Get single product by ID.

**Response:** `200 OK`

```json
{
  "product": {
    /* product object */
  }
}
```

### Get Product by Slug

**GET** `/products/slug/:slug`

Get single product by slug.

**Response:** `200 OK`

```json
{
  "product": {
    /* product object */
  }
}
```

### Create Product (Admin Only)

**POST** `/products`

Create a new product.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
  "name": "Organic Vermicompost",
  "slug": "organic-vermicompost",
  "description": "Premium vermicompost...",
  "price": 399.0,
  "weight": "10 kg",
  "stock": 50,
  "imageUrl": "https://...",
  "images": ["https://..."],
  "benefits": ["Rich in microorganisms", "Improves water retention"],
  "usage": "Mix with soil...",
  "composition": "Cow dung and organic waste",
  "isActive": true,
  "isFeatured": false
}
```

**Response:** `201 Created`

```json
{
  "product": {
    /* created product */
  }
}
```

### Update Product (Admin Only)

**PUT** `/products/:id`

Update existing product.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Name",
  "price": 349.0,
  "stock": 75
}
```

**Response:** `200 OK`

```json
{
  "product": {
    /* updated product */
  }
}
```

### Delete Product (Admin Only)

**DELETE** `/products/:id`

Delete a product.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:** `200 OK`

```json
{
  "message": "Product deleted successfully"
}
```

---

## Order Endpoints

### Create Order

**POST** `/orders`

Create a new order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "items": [
    {
      "productId": "clxxx...",
      "quantity": 2,
      "weight": "5 kg"
    }
  ],
  "shippingAddressId": "clxxx..."
}
```

**Response:** `201 Created`

```json
{
  "order": {
    "id": "clxxx...",
    "orderNumber": "ORG-1K5L2M-3N4P5",
    "userId": "clxxx...",
    "subtotal": 598.0,
    "shippingCost": 0,
    "tax": 0,
    "total": 598.0,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "items": [
      {
        "id": "clxxx...",
        "quantity": 2,
        "price": 299.0,
        "weight": "5 kg",
        "product": {
          /* product details */
        }
      }
    ],
    "createdAt": "2026-02-06T10:00:00.000Z"
  }
}
```

### Get User Orders

**GET** `/orders`

Get authenticated user's orders.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** `200 OK`

```json
{
  "orders": [
    /* array of orders */
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### Get Order by ID

**GET** `/orders/:id`

Get single order details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

```json
{
  "order": {
    /* order with items, payment, and user details */
  }
}
```

### Update Order Status (Admin Only)

**PATCH** `/orders/:id`

Update order status, tracking, or notes.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
  "status": "SHIPPED",
  "trackingNumber": "TRK123456789",
  "notes": "Package dispatched via FedEx"
}
```

**Response:** `200 OK`

```json
{
  "order": {
    /* updated order */
  }
}
```

### Get All Orders (Admin Only)

**GET** `/admin/orders`

Get all orders with filtering.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**

- `page`, `limit`: Pagination
- `status`: Filter by order status

**Response:** `200 OK`

```json
{
  "orders": [
    /* array of all orders with user details */
  ],
  "pagination": {
    /* pagination info */
  }
}
```

---

## Address Endpoints

### Get User Addresses

**GET** `/addresses`

Get all addresses for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

```json
{
  "addresses": [
    {
      "id": "clxxx...",
      "fullName": "John Doe",
      "phone": "+91 9876543210",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apartment 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India",
      "isDefault": true,
      "createdAt": "2026-02-06T10:00:00.000Z"
    }
  ]
}
```

### Create Address

**POST** `/addresses`

Add new delivery address.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "fullName": "John Doe",
  "phone": "+91 9876543210",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apartment 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India",
  "isDefault": true
}
```

**Response:** `201 Created`

```json
{
  "address": {
    /* created address */
  }
}
```

---

## Payment Endpoints

### Create Razorpay Order

**POST** `/payments/create`

Create Razorpay order for payment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "orderId": "clxxx..."
}
```

**Response:** `200 OK`

```json
{
  "razorpayOrderId": "order_xxx...",
  "amount": 59800,
  "currency": "INR",
  "keyId": "rzp_test_xxx..."
}
```

### Verify Payment

**POST** `/payments/verify`

Verify Razorpay payment signature.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "razorpayOrderId": "order_xxx...",
  "razorpayPaymentId": "pay_xxx...",
  "razorpaySignature": "xxx..."
}
```

**Response:** `200 OK`

```json
{
  "message": "Payment verified successfully",
  "orderId": "clxxx..."
}
```

### Razorpay Webhook

**POST** `/webhooks/razorpay`

Handle Razorpay payment webhooks.

**Headers:**

- `x-razorpay-signature`: Webhook signature

**Request Body:** Razorpay webhook payload

**Response:** `200 OK`

```json
{
  "received": true
}
```

---

## Error Responses

All endpoints may return error responses:

### 400 Bad Request

```json
{
  "error": "Validation error",
  "details": [
    {
      "path": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "error": "Unauthorized. Admin access required."
}
```

### 404 Not Found

```json
{
  "error": "Product not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "An unexpected error occurred"
}
```

---

## Order Status Flow

```
PENDING → PROCESSING → CONFIRMED → SHIPPED → DELIVERED
                ↓
            CANCELLED
```

## Payment Status Flow

```
PENDING → COMPLETED
    ↓
  FAILED
    ↓
 REFUNDED
```

---

## Rate Limiting

- Public endpoints: 100 requests per 15 minutes
- Authenticated endpoints: 200 requests per 15 minutes
- Admin endpoints: 500 requests per 15 minutes

## Security

- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days (configurable)
- HTTPS required in production
- CORS enabled for specified origins
- Input validation with Zod on all endpoints
