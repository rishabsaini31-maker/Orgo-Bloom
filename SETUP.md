# Orgobloom E-Commerce Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Razorpay account (for payment integration)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fertilizer_shop?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Razorpay
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"

# Admin Default Credentials
ADMIN_EMAIL="admin@fertilizer.com"
ADMIN_PASSWORD="Admin@123"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Create Admin User

Run this script or manually insert into database:

```sql
INSERT INTO users (id, email, password, name, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'admin-id-123',
  'admin@fertilizer.com',
  -- Password hash for 'Admin@123' (use bcrypt to generate)
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5DYB.5lTKd1sq',
  'Admin',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

Or use the registration API and then manually update the role to 'ADMIN' in the database.

### 5. Add Sample Products (Optional)

```sql
INSERT INTO products (id, name, slug, description, price, weight, stock, "isActive", "isFeatured", benefits, "createdAt", "updatedAt")
VALUES
(
  'prod-1',
  'Premium Cow Manure Fertilizer',
  'premium-cow-manure-fertilizer',
  'High-quality organic cow manure fertilizer perfect for all types of plants and gardens.',
  299.00,
  '5 kg',
  100,
  true,
  true,
  ARRAY['100% organic', 'Improves soil health', 'Rich in nutrients', 'Eco-friendly'],
  NOW(),
  NOW()
),
(
  'prod-2',
  'Organic Vermicompost',
  'organic-vermicompost',
  'Premium vermicompost made from cow dung and organic waste.',
  399.00,
  '10 kg',
  50,
  true,
  true,
  ARRAY['Rich in beneficial microorganisms', 'Improves water retention', 'Boosts plant growth'],
  NOW(),
  NOW()
);
```

### 6. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
orgobloom/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── products/     # Product CRUD
│   │   ├── orders/       # Order management
│   │   ├── payments/     # Razorpay integration
│   │   └── webhooks/     # Payment webhooks
│   ├── admin/            # Admin panel pages
│   ├── auth/             # Login/Register pages
│   ├── products/         # Product listing & details
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Checkout flow
│   ├── dashboard/        # Customer dashboard
│   └── page.tsx          # Home page
├── components/           # Reusable components
├── lib/                  # Utilities & helpers
├── store/                # Zustand state management
├── prisma/               # Database schema
└── types/                # TypeScript types
```

## Key Features

### Customer Features

- ✅ Browse products with search & pagination
- ✅ Product details with images & descriptions
- ✅ Shopping cart with quantity management
- ✅ User registration & authentication
- ✅ Address management
- ✅ Secure checkout with Razorpay
- ✅ Order tracking & history
- ✅ Customer dashboard

### Admin Features

- ✅ Product management (Add/Edit/Delete)
- ✅ Order management & status updates
- ✅ Dashboard with sales analytics
- ✅ Inventory tracking
- ✅ Customer order history

### Technical Features

- ✅ Next.js 14 App Router
- ✅ TypeScript for type safety
- ✅ PostgreSQL with Prisma ORM
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Razorpay payment integration
- ✅ Webhook handling for payments
- ✅ Responsive design with Tailwind CSS
- ✅ State management with Zustand
- ✅ Form validation with Zod

## Razorpay Setup

1. Sign up at https://razorpay.com
2. Get your API keys from the dashboard
3. Add keys to `.env` file
4. Configure webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
5. Enable webhook events: `payment.captured`, `payment.failed`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## Security Notes

1. Change default admin credentials immediately
2. Use strong JWT_SECRET in production
3. Enable HTTPS for production
4. Regularly update dependencies
5. Never commit `.env` file
6. Use environment variables for all secrets

## Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database permissions

### Razorpay Payment Issues

- Verify API keys are correct
- Check webhook URL is accessible
- Ensure HTTPS in production

### Authentication Issues

- Clear browser localStorage
- Check JWT_SECRET is set
- Verify token expiration settings

## Support

For issues or questions:

- Check the README.md
- Review API documentation
- Contact development team

---

Built with ❤️ for organic farming
