# 🚀 Quick Start Guide - Production Features

## Setup in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Update Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM="Orgobloom <noreply@orgobloom.com>"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:9000

# JWT Secret (Generate a strong random string!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this-in-production
```

### Step 3: Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Or create a proper migration
npx prisma migrate dev --name add_production_features
```

### Step 4: Run the App

```bash
npm run dev
```

Visit: `http://localhost:9000`

---

## 🔑 Gmail App Password Setup (5 minutes)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App Passwords** section
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use it in `SMTP_PASSWORD` env variable

---

## ✅ Feature Testing Checklist

### Test Authentication Features:

```bash
# 1. Register a new user
POST http://localhost:9000/api/auth/register
{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Test User",
  "phone": "1234567890"
}

# 2. Check your email for verification link

# 3. Test forgot password
POST http://localhost:9000/api/auth/forgot-password
{
  "email": "test@example.com"
}

# 4. Check email for reset link
```

### Test Order Features:

- Create an order
- Wait for payment confirmation
- Try to cancel the order
- Download invoice PDF (`/api/orders/:id/invoice`)
- Request a refund

### Test Admin Features:

- Login as admin
- View analytics (`/api/admin/analytics`)
- Block a user
- Approve/reject refunds

---

## 📬 Test Email Templates

All emails are sent automatically:

- ✉️ **Welcome Email** - On registration
- 🔒 **Password Reset** - When requested
- 📦 **Order Confirmation** - After payment
- 🚚 **Shipping Update** - When order status changes
- 💰 **Refund Status** - When refund is processed

---

## 🔥 Quick API Tests (Using curl)

### Register:

```bash
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### Login:

```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Forgot Password:

```bash
curl -X POST http://localhost:9000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 🐛 Troubleshooting

### Email not sending?

- Check SMTP credentials
- Verify Gmail app password
- Check console logs for errors
- Test email settings with a simple script

### Database errors?

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or just push schema
npx prisma db push --force-reset
```

### Rate limiting issues?

- Clear rate limit store: Restart the server
- Adjust limits in `/lib/rate-limit.ts`

---

## 📱 Frontend Pages to Build

Create these pages to use the new APIs:

1. `/app/auth/forgot-password/page.tsx`
2. `/app/auth/reset-password/page.tsx`
3. `/app/auth/verify-email/page.tsx`
4. `/app/profile/page.tsx`
5. `/app/admin/users/page.tsx`
6. `/app/admin/refunds/page.tsx`
7. `/app/admin/analytics/page.tsx`

Example UI patterns provided in main documentation.

---

## 🎯 Everything Works? Start Building UI!

All backend features are complete and tested. Now you can:

1. Build beautiful frontend pages
2. Add loading states and error handling
3. Implement real-time notifications
4. Create admin dashboards with charts

**Your backend is production-ready! 🚀**
