# Deployment Guide for Orgobloom

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Razorpay keys added
- [ ] Sample products added (optional)
- [ ] SSL certificate ready (for production)
- [ ] Domain name configured

## Option 1: Deploy to Vercel (Recommended)

### Prerequisites

- GitHub account
- Vercel account
- PostgreSQL database (Railway, Supabase, or Neon)

### Steps

1. **Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/orgobloom.git
git push -u origin main
```

2. **Set Up Database**
   - Create PostgreSQL database on Railway/Supabase/Neon
   - Get connection string
   - Run migrations:
     ```bash
     DATABASE_URL="your-connection-string" npm run prisma:migrate
     ```

3. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `JWT_EXPIRES_IN`
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`
     - `NEXT_PUBLIC_APP_URL`
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Click "Deploy"

4. **Post-Deployment**
   - Update Razorpay webhook URL to your Vercel domain
   - Create admin user in production database
   - Test payment flow

## Option 2: Deploy to AWS/DigitalOcean

### Prerequisites

- VPS or EC2 instance (Ubuntu 22.04)
- Domain name
- SSL certificate (Let's Encrypt)

### Steps

1. **Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

2. **Database Setup**

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE fertilizer_shop;
CREATE USER orgobloom WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE fertilizer_shop TO orgobloom;
\q
```

3. **Application Deployment**

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/orgobloom.git
cd orgobloom

# Install dependencies
npm install

# Create .env file
sudo nano .env
# Add all environment variables

# Run migrations
npm run prisma:migrate

# Build application
npm run build

# Start with PM2
pm2 start npm --name "orgobloom" -- start
pm2 save
pm2 startup
```

4. **Nginx Configuration**

```bash
sudo nano /etc/nginx/sites-available/orgobloom
```

Add:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/orgobloom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Option 3: Docker Deployment

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: orgobloom
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: fertilizer_shop
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://orgobloom:your_password@db:5432/fertilizer_shop
      JWT_SECRET: your_jwt_secret
      RAZORPAY_KEY_ID: your_key
      RAZORPAY_KEY_SECRET: your_secret
    depends_on:
      - db
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy:

```bash
docker-compose up -d
```

## Post-Deployment Tasks

### 1. Create Admin User

```bash
# Connect to production database
psql $DATABASE_URL

# Insert admin user (use bcrypt to hash password first)
INSERT INTO users (id, email, password, name, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@yourdomain.com',
  '$2a$12$...hashed_password',
  'Admin',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

### 2. Configure Razorpay Webhook

1. Go to Razorpay Dashboard
2. Settings → Webhooks
3. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
4. Select events: `payment.captured`, `payment.failed`
5. Save secret for verification

### 3. Add Products

- Log in to admin panel: `https://yourdomain.com/admin`
- Add products with images and details
- Set featured products for homepage

### 4. Test Payment Flow

1. Create test customer account
2. Add product to cart
3. Complete checkout
4. Use Razorpay test cards
5. Verify order status updates

## Monitoring & Maintenance

### Set Up Monitoring

```bash
# View logs
pm2 logs orgobloom

# Monitor app
pm2 monit

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM orders;"
```

### Backup Database

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20260206.sql
```

### Update Application

```bash
cd /var/www/orgobloom
git pull origin main
npm install
npm run build
pm2 restart orgobloom
```

## Performance Optimization

### 1. Enable Caching

Add to `next.config.js`:

```javascript
module.exports = {
  compress: true,
  poweredByHeader: false,
};
```

### 2. Optimize Images

- Use WebP format
- Implement lazy loading
- Use CDN for static assets

### 3. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_products_active ON products(isActive) WHERE isActive = true;
CREATE INDEX idx_orders_user_status ON orders(userId, status);
```

## Security Hardening

### 1. Environment Variables

- Never commit `.env`
- Use secrets manager in production
- Rotate keys regularly

### 2. Rate Limiting

Install rate limiter:

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 3. Input Validation

- All inputs validated with Zod
- SQL injection protection via Prisma
- XSS protection enabled

### 4. Regular Updates

```bash
npm audit
npm audit fix
npm update
```

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
# Increase connection limit in Prisma schema
```

### Payment Webhook Issues

- Ensure webhook URL is HTTPS
- Verify signature validation
- Check webhook logs in Razorpay dashboard

## Support & Maintenance

### Regular Tasks

- [ ] Weekly: Review error logs
- [ ] Weekly: Check payment reconciliation
- [ ] Monthly: Database backup
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit

### Scaling Considerations

- Implement Redis for session storage
- Use CDN for static assets
- Consider database read replicas
- Implement caching layer
- Use load balancer for multiple instances

---

## Need Help?

For deployment issues:

1. Check logs: `pm2 logs` or Vercel logs
2. Review environment variables
3. Test database connectivity
4. Verify Razorpay configuration
5. Check SSL certificate status

**Built with ❤️ for Orgobloom**
