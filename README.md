# Orgobloom

A production-ready e-commerce platform for selling organic fertilizers (cow manure) built with Next.js, TypeScript, PostgreSQL, Prisma, and Razorpay.

## 🚀 Features

### Customer Features

- Browse products with detailed information
- User registration and authentication
- Shopping cart management
- Secure checkout with Razorpay
- Order tracking and history
- Address management
- Customer dashboard

### Admin Panel

- Product management (CRUD operations)
- Order management and status updates
- Customer management
- Inventory tracking
- Sales analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Payment**: Razorpay Integration
- **Authentication**: JWT with role-based access control

## 📦 Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your credentials.

4. Set up database:

   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

- **User**: Customer and admin accounts
- **Product**: Fertilizer products
- **Order**: Customer orders
- **OrderItem**: Line items in orders
- **Address**: Customer delivery addresses
- **Payment**: Payment transaction records

## 🔐 Security

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (Customer/Admin)
- Secure API endpoints
- Payment verification

## 📱 Pages

### Customer Pages

- `/` - Home page
- `/products` - Product listing
- `/products/[id]` - Product details
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/dashboard` - Customer dashboard
- `/auth/login` - Customer login
- `/auth/register` - Customer registration

### Admin Pages

- `/admin` - Admin dashboard
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/customers` - Customer management

## 🔌 API Routes

- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - User login
- `GET /api/products` - List products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/[id]` - Update product (admin)
- `DELETE /api/products/[id]` - Delete product (admin)
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `POST /api/payments/create` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/webhooks/razorpay` - Payment webhook

## 💳 Razorpay Integration

1. Sign up for Razorpay account
2. Get API keys from dashboard
3. Add keys to `.env` file
4. Configure webhook URL in Razorpay dashboard

## 🚀 Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations: `npm run prisma:migrate`
4. Build: `npm run build`
5. Start: `npm start`

## 📄 License

This project is built for a client and is proprietary.
