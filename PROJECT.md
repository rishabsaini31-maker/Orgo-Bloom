# Orgobloom - E-Commerce Platform

## Project Overview

**Orgobloom** is a production-ready e-commerce platform built for selling organic fertilizers (cow manure). The platform features a modern customer-facing website, comprehensive admin panel, and secure payment integration with Razorpay.

### Project Name

**Orgobloom** - A blend of "Organic" and "Bloom", representing natural growth through organic farming.

---

## Technology Stack

### Frontend

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - Runtime environment
- **PostgreSQL** - Relational database
- **Prisma ORM** - Type-safe database client

### Payment

- **Razorpay** - Payment gateway integration
- Webhook handling for payment events
- Secure signature verification

### Authentication & Security

- **JWT** - JSON Web Tokens
- **bcrypt** - Password hashing
- Role-based access control (CUSTOMER/ADMIN)
- Input validation with Zod

---

## Project Structure

```
orgobloom/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Authentication endpoints
│   │   │   ├── register/      # Customer registration
│   │   │   ├── login/         # User login
│   │   │   └── me/            # Get current user
│   │   ├── products/          # Product CRUD
│   │   │   ├── route.ts       # List & create products
│   │   │   ├── [id]/          # Get/update/delete by ID
│   │   │   └── slug/[slug]/   # Get by slug
│   │   ├── orders/            # Order management
│   │   │   ├── route.ts       # Create & list orders
│   │   │   └── [id]/          # Get & update order
│   │   ├── admin/             # Admin-specific APIs
│   │   │   └── orders/        # Admin order management
│   │   ├── addresses/         # Address management
│   │   ├── payments/          # Razorpay integration
│   │   │   ├── create/        # Create Razorpay order
│   │   │   └── verify/        # Verify payment
│   │   └── webhooks/          # Payment webhooks
│   │       └── razorpay/      # Razorpay webhook handler
│   ├── admin/                 # Admin Panel
│   │   ├── layout.tsx         # Admin layout with nav
│   │   ├── page.tsx           # Dashboard with stats
│   │   ├── products/          # Product management
│   │   │   ├── page.tsx       # Product list
│   │   │   ├── new/           # Add new product
│   │   │   └── [id]/          # Edit product
│   │   └── orders/            # Order management
│   │       └── page.tsx       # Orders list & updates
│   ├── auth/                  # Authentication Pages
│   │   ├── login/             # Login page
│   │   └── register/          # Registration page
│   ├── products/              # Customer Product Pages
│   │   ├── page.tsx           # Product listing
│   │   └── [slug]/            # Product detail page
│   ├── cart/                  # Shopping Cart
│   │   └── page.tsx           # Cart page
│   ├── checkout/              # Checkout Flow
│   │   └── page.tsx           # Checkout with Razorpay
│   ├── dashboard/             # Customer Dashboard
│   │   ├── page.tsx           # Dashboard overview
│   │   └── orders/            # Order history
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Homepage
│   └── globals.css            # Global styles
├── components/                # Reusable Components
│   ├── Header.tsx             # Navigation header
│   ├── Footer.tsx             # Site footer
│   └── ProductCard.tsx        # Product card component
├── lib/                       # Utilities & Helpers
│   ├── prisma.ts              # Prisma client
│   ├── auth.ts                # Auth utilities (JWT, bcrypt)
│   ├── validations.ts         # Zod schemas
│   ├── api-utils.ts           # API response handlers
│   ├── api-client.ts          # Axios client
│   ├── razorpay.ts            # Razorpay configuration
│   └── utils.ts               # Helper functions
├── store/                     # State Management
│   ├── cart-store.ts          # Shopping cart state
│   └── auth-store.ts          # Authentication state
├── prisma/                    # Database
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── types/                     # TypeScript Types
│   └── env.d.ts               # Environment variables types
├── middleware.ts              # Next.js middleware
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.ts         # Tailwind config
├── next.config.js             # Next.js config
├── README.md                  # Project documentation
├── SETUP.md                   # Setup instructions
├── DEPLOYMENT.md              # Deployment guide
└── API.md                     # API documentation
```

---

## Features

### Customer Features ✅

#### Public Pages

- **Homepage** - Hero section, featured products, call-to-action
- **Product Listing** - Paginated grid with search & filters
- **Product Details** - Full product info, images, add to cart

#### Authentication

- Customer registration with validation
- Secure login with JWT tokens
- Password requirements (min 8 chars, uppercase, lowercase, numbers)

#### Shopping Experience

- Add/remove/update cart items
- Persistent cart (localStorage)
- Real-time cart count in header
- Stock availability checks

#### Checkout & Orders

- Address management (add/edit/set default)
- Order creation with inventory checks
- Razorpay payment integration
- Payment verification
- Order history & tracking
- Order status updates

#### Customer Dashboard

- View all orders
- Order details & status
- Delivery tracking
- Total/active/completed orders stats

### Admin Features ✅

#### Admin Dashboard

- Total orders count
- Pending orders count
- Total revenue (completed payments)
- Total products count
- Recent orders table

#### Product Management

- Create new products
- Edit existing products
- Delete products
- Auto-generate URL slugs
- Manage stock levels
- Toggle active/featured status
- Add benefits, usage, composition

#### Order Management

- View all orders with filters
- Update order status
- Add tracking numbers
- Add notes for customers
- View customer details
- Payment status tracking

#### Access Control

- Admin-only routes protected
- Role-based authentication
- Separate admin layout

---

## Database Schema

### Models

#### User

- **Role:** CUSTOMER | ADMIN
- **Fields:** id, email, password (hashed), name, phone, role
- **Relations:** orders, addresses

#### Product

- **Fields:** id, name, slug, description, price, weight, stock
- **Media:** imageUrl, images[]
- **Details:** benefits[], usage, composition
- **Status:** isActive, isFeatured
- **Relations:** orderItems

#### Order

- **Status:** PENDING | PROCESSING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
- **Payment:** PENDING | COMPLETED | FAILED | REFUNDED
- **Fields:** orderNumber, subtotal, shipping, tax, total
- **Relations:** user, items, payment

#### OrderItem

- **Fields:** productId, quantity, price, weight
- **Relations:** order, product

#### Address

- **Fields:** fullName, phone, addressLine1/2, city, state, pincode
- **Relations:** user

#### Payment

- **Fields:** razorpayOrderId, razorpayPaymentId, razorpaySignature
- **Amount:** amount, currency
- **Relations:** order

---

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register customer
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products

- `GET /api/products` - List products (public)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id` - Update order (admin)
- `GET /api/admin/orders` - Get all orders (admin)

### Addresses

- `GET /api/addresses` - Get user addresses
- `POST /api/addresses` - Add address

### Payments

- `POST /api/payments/create` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/webhooks/razorpay` - Payment webhook

---

## Security Features

### Authentication

- JWT tokens with configurable expiration
- Secure password hashing with bcrypt (12 rounds)
- Role-based access control (RBAC)
- Protected routes for admin/customer

### Input Validation

- Zod validation on all API endpoints
- Type-safe with TypeScript
- SQL injection protection via Prisma

### Payment Security

- Razorpay signature verification
- Webhook signature validation
- Secure environment variables

### General Security

- HTTPS required in production
- Security headers (XSS, clickjacking protection)
- No sensitive data in client-side code
- Password strength requirements

---

## Key Business Logic

### Shipping Calculation

```typescript
// Free shipping above ₹999
if (subtotal >= 999) return 0;
return 50;
```

### Tax Calculation

```typescript
// 18% GST (configurable)
const tax = subtotal * 0.18;
```

### Order Number Generation

```typescript
// Format: ORG-{timestamp}-{random}
"ORG-1K5L2M-3N4P5";
```

### Stock Management

- Stock checked before order creation
- Stock decremented after payment verification
- Out of stock products can't be ordered

### Payment Flow

1. Customer creates order (status: PENDING)
2. Razorpay order created
3. Customer completes payment
4. Payment verified via signature
5. Order status → PROCESSING
6. Stock decremented
7. Admin updates to SHIPPED/DELIVERED

---

## State Management

### Cart Store (Zustand)

- Persistent cart in localStorage
- Add/remove/update items
- Calculate totals
- Stock validation

### Auth Store (Zustand)

- User details
- JWT token
- Login/logout actions
- Persistent authentication

---

## Deployment Options

### Option 1: Vercel (Recommended)

- Automatic deployments
- Environment variables management
- Built-in CDN
- Serverless functions

### Option 2: VPS/Cloud

- AWS, DigitalOcean, Linode
- Nginx reverse proxy
- PM2 process manager
- PostgreSQL on same/separate server

### Option 3: Docker

- Containerized deployment
- Docker Compose with PostgreSQL
- Easy scaling
- Reproducible environment

---

## Performance Considerations

### Optimizations Implemented

- Image lazy loading with Next.js
- Pagination for large lists
- Database indexes on frequently queried fields
- Connection pooling with Prisma
- Static page optimization where possible

### Recommendations for Scale

- Implement Redis for caching
- Use CDN for static assets
- Database read replicas
- Rate limiting on APIs
- Load balancing for multiple instances

---

## Development Workflow

### Local Setup

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

### Database Management

```bash
npm run prisma:studio    # GUI for database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
```

### Production Build

```bash
npm run build
npm start
```

---

## Testing Considerations

### Recommended Testing

- **Unit Tests:** Utility functions, validation schemas
- **Integration Tests:** API endpoints
- **E2E Tests:** User flows (checkout, payment)
- **Load Tests:** Performance under traffic

### Test Payment

Use Razorpay test mode:

- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

---

## Future Enhancements

### Potential Features

- [ ] Email notifications (order confirmations)
- [ ] SMS notifications (order updates)
- [ ] Product reviews & ratings
- [ ] Wishlist functionality
- [ ] Coupon/discount codes
- [ ] Bulk order discounts
- [ ] Subscription model
- [ ] Multiple payment methods
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Inventory forecasting
- [ ] Customer loyalty program

---

## Maintenance

### Regular Tasks

- **Weekly:** Review errors, check payment reconciliation
- **Monthly:** Database backups, dependency updates
- **Quarterly:** Security audit, performance review

### Monitoring

- Application logs
- Payment gateway logs
- Database performance
- User analytics

---

## Support & Documentation

### Available Documentation

- **README.md** - Project overview & features
- **SETUP.md** - Detailed setup instructions
- **DEPLOYMENT.md** - Deployment guides
- **API.md** - Complete API documentation

### Getting Help

1. Check documentation
2. Review error logs
3. Test in isolation
4. Contact development team

---

## License & Credits

**Project:** Orgobloom E-Commerce Platform  
**Built For:** Organic Fertilizer Business  
**Tech Stack:** Next.js 14, TypeScript, PostgreSQL, Prisma, Razorpay  
**Purpose:** Client freelance project

### Development Standards

✅ Production-ready code  
✅ Clean & modular architecture  
✅ Comprehensive error handling  
✅ Security best practices  
✅ Scalable design patterns  
✅ Complete documentation

---

**Built with ❤️ for sustainable organic farming**
