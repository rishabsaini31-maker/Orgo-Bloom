# Google OAuth Implementation Guide

## Overview

This application uses **Google OAuth** as the sole authentication method. Users can only sign in using their Google account. No email/password authentication is supported.

## Features

- ✅ Google OAuth 2.0 integration
- ✅ JWT session strategy
- ✅ Automatic user creation on first login
- ✅ HTTP-only secure cookies
- ✅ Role-based access control (CUSTOMER/ADMIN)
- ✅ Profile dropdown with user image
- ✅ Logout from all devices support
- ✅ Middleware-based route protection
- ✅ Rate limiting ready
- ✅ CSRF protection

## Setup Instructions

### 1. Google Cloud Configuration

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "Orgobloom")
4. Click "Create"

#### Step 2: Enable Google+ API

1. In the console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

#### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth Client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in app name, user support email, developer contact
   - Add scopes: `email`, `profile`, `openid`
   - Add test users
   - Save and continue
4. Back to credentials:
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:9000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Click "Create"

#### Step 4: Copy Credentials

- Copy your **Client ID**
- Copy your **Client Secret**
- Store these securely

### 2. Environment Variables

Update `.env` file with your Google credentials:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# NextAuth Secret - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret"

# App URL
NEXTAUTH_URL="http://localhost:9000"  # Development
# NEXTAUTH_URL="https://yourdomain.com"  # Production
```

#### Generate NEXTAUTH_SECRET

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
$([System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random -Count 32 -InputObject (32..126 | ForEach-Object {[char]$_}) | Join-String)))).Substring(0,43) + "="
```

### 3. Database Schema

The User model has been configured for OAuth:

```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  name                String
  image               String?   // Profile image from Google
  phone               String?

  // OAuth fields
  provider            String    @default("google")
  providerAccountId   String    // Google sub
  emailVerified       DateTime  @default(now())

  role                Role      @default(CUSTOMER)
  isBlocked           Boolean   @default(false)
  blockedAt           DateTime?
  blockedReason       String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  orders              Order[]
  addresses           Address[]
  sessions            Session[]
  recentlyViewed      RecentlyViewed[]
  notifications       Notification[]
  reviews             Review[]
  backInStockAlerts   BackInStockAlert[]
  chatMessages        ChatMessage[]

  @@unique([provider, providerAccountId])
  @@index([email])
  @@map("users")
}
```

### 4. Run Migrations

```bash
# Generate updated Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Or push schema directly
npm run prisma:push
```

## How It Works

### 1. User Signs In

1. User clicks "Continue with Google" on login page
2. User is redirected to Google OAuth consent screen
3. User logs in with their Google account
4. Google redirects back with authorization code

### 2. User Created/Updated

- **First Login**: New user is created in database
  - Email and name auto-filled from Google
  - Profile image synced from Google
  - Role set to CUSTOMER by default
- **Subsequent Login**: Session is created, user not duplicated

### 3. Session Management

- JWT tokens are used for session strategy
- Session stored in encrypted HTTP-only cookies
- Token expires after 7 days
- Tokens are automatically refreshed daily

### 4. Protected Routes

The following routes require authentication:

- `/dashboard`
- `/profile`
- `/orders`
- `/favorites`
- `/checkout`
- `/admin` (ADMIN role required)

Unauthenticated users are redirected to `/login`

## API Routes

### Protected API Endpoints

All API endpoints using `getServerSession` are automatically protected:

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your protected logic here
}
```

### Available Hooks

**Client-side authentication:**

```typescript
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "authenticated") {
    // User is signed in
    console.log(session.user.email);
    console.log(session.user.role);
    console.log(session.user.image);
  }
}
```

**Sign out:**

```typescript
import { signOut } from "next-auth/react";

await signOut({ redirect: true, callbackUrl: "/" });
```

## Security Features

### 1. Secure Cookies

- **Development**: Plain cookies
- **Production**: `__Secure-` prefix, HTTPS required, SameSite=Lax
- **HttpOnly**: Inaccessible to JavaScript
- **Expires**: 7 days

### 2. CSRF Protection

Built-in with NextAuth - automatically validates CSRF tokens

### 3. Session Validation

- Sessions checked on every page load
- Expired sessions automatically cleared
- Invalid tokens rejected

### 4. Middleware Protection

Routes protected at the middleware level before reaching the server

### 5. Environment Variable Validation

Startup will fail if required OAuth variables are missing

### 6. No Password Storage

Google handles all password authentication - no passwords stored in database

## Testing

### Login Flow

1. Start development server: `npm run dev`
2. Visit `http://localhost:9000/login`
3. Click "Continue with Google"
4. Use your Google test account
5. You should be redirected to dashboard

### Protected Routes

1. Try accessing `/dashboard` without logging in
2. Should redirect to `/login`
3. After login, dashboard should be accessible

### Logout

1. Click profile dropdown in header
2. Click "Logout"
3. Should redirect to home page
4. Try accessing protected route - redirects to login

## Production Deployment

### Vercel Deployment

1. **Update Environment Variables**

   ```bash
   GOOGLE_CLIENT_ID=your-production-id
   GOOGLE_CLIENT_SECRET=your-production-secret
   NEXTAUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://yourdomain.com
   ```

2. **Update Google OAuth Redirect URI**
   - Add `https://yourdomain.com/api/auth/callback/google` to authorized URIs
   - Remove `http://localhost:9000` redirect URI

3. **Deploy**

   ```bash
   git push  # Auto-deploys if configured
   ```

4. **Verify**
   - Test sign-in on production URL
   - Check that cookies have `Secure` flag
   - Verify HTTPS is enforced

### Environment-Dependent Settings

These are automatically configured:

- Cookie security flags
- HTTPS requirement
- CSRF validation

## Troubleshooting

### "Missing required environment variables"

**Solution**: Check `.env` file has:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### "Failed to sign in with Google"

**Check**:

1. Client ID and Secret are correct
2. Redirect URI matches Google Console settings
3. Callback URL ends with `/api/auth/callback/google`
4. NEXTAUTH_URL matches your domain

### Redirect URI Mismatch

**Solution**: Add the exact URI to Google Cloud Console:

- Development: `http://localhost:9000/api/auth/callback/google`
- Production: `https://yourdomain.com/api/auth/callback/google`

### Session Not Persisting

**Check**:

1. SessionProvider wraps app in root layout
2. NEXTAUTH_SECRET is set
3. Cookies are not disabled in browser
4. Clock skew between servers

## File Structure

```
app/
  api/
    auth/
      [...nextauth]/
        route.ts          # Auth handler
    profile/
      route.ts            # Protected profile endpoint
  auth/
    login/
      page.tsx            # OAuth login page
  login/
    page.tsx              # Redirect point for unauthenticated users
  layout.tsx              # SessionProvider wrapper

lib/
  auth.ts                 # NextAuth configuration
  auth-utils.ts          # Route protection utilities

components/
  SessionProvider.tsx     # Session provider wrapper
  Header.tsx             # Profile dropdown component

types/
  next-auth.d.ts         # TypeScript augmentation for NextAuth
  env.d.ts              # Environment variables types

middleware.ts            # Route protection middleware
```

## Next Steps

1. ✅ Google OAuth setup complete
2. Configure additional providers if needed (optional)
3. Set up email notifications for new users
4. Implement admin user assignment
5. Add profile completion flow for additional data
6. Set up analytics tracking for sign-ins

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Documentation](https://www.prisma.io/docs/)
