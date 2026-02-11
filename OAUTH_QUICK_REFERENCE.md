# OAuth Implementation - Quick Reference

## What's Implemented

### Core Authentication

- [x] Google OAuth 2.0 only (no email/password)
- [x] NextAuth.js v5 (latest)
- [x] JWT session strategy
- [x] HTTP-only secure cookies (production-ready)
- [x] CSRF protection built-in

### Database

- [x] Updated User model with OAuth fields
  - `provider` (default: "google")
  - `providerAccountId` (Google sub)
  - `image` (Google profile picture)
  - `emailVerified` (auto-set to now())
- [x] Removed password-related fields
- [x] Removed password reset/email verification tokens

### Routes & Pages

- [x] `/login` - OAuth login page (Google button only)
- [x] `/api/auth/[...nextauth]` - Auth handler
- [x] `/auth/login` - Alternate login route
- [x] `/auth/error` - Auth error page
- [x] Middleware protecting: /dashboard, /profile, /orders, /admin

### UI Components

- [x] Login page - Clean, centered card design
- [x] Profile dropdown in header with user image
- [x] Logout button
- [x] Role-based menu items (Admin link for admins)
- [x] Loading states on buttons
- [x] Error message display

### Security

- [x] Secure cookies (HTTP-only, HTTPS in production)
- [x] Route protection via middleware
- [x] Admin role validation
- [x] Session validation on each request
- [x] No sensitive data in logs
- [x] Environment variable validation
- [x] CORS-ready headers

### API & Utilities

- [x] `getServerSession()` for protected API routes
- [x] `useSession()` hook for client components
- [x] `signOut()` for logout
- [x] `signIn()` for login
- [x] Route protection helpers in `lib/auth-utils.ts`

## Key Files

| File                                  | Purpose                         |
| ------------------------------------- | ------------------------------- |
| `lib/auth.ts`                         | NextAuth configuration, options |
| `lib/auth-utils.ts`                   | Route protection helpers        |
| `middleware.ts`                       | Route protection middleware     |
| `app/api/auth/[...nextauth]/route.ts` | Auth handler                    |
| `app/login/page.tsx`                  | OAuth login page                |
| `components/Header.tsx`               | Profile dropdown, user menu     |
| `components/SessionProvider.tsx`      | Session provider wrapper        |
| `types/next-auth.d.ts`                | NextAuth TypeScript types       |

## Environment Variables Required

```bash
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=xxx (generate with: openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:9000
```

## How to Use in Components

### Check if user is logged in

```typescript
import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Not signed in</div>;

  // User is authenticated
  return <div>Hello {session.user.name}</div>;
}
```

### Access user data

```typescript
const { data: session } = useSession();

// Available properties:
session.user.id; // User ID
session.user.email; // Email
session.user.name; // Name
session.user.image; // Profile picture URL
session.user.role; // "ADMIN" or "CUSTOMER"
```

### Sign out

```typescript
import { signOut } from "next-auth/react";

<button onClick={() => signOut({ redirect: true, callbackUrl: "/" })}>
  Logout
</button>
```

### Protect API routes

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected logic here
  // session.user.id is available
  // session.user.role is available
}
```

### Admin-only API routes

```typescript
import { protectAdminRoute } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const result = await protectAdminRoute(request);

  if (result instanceof NextResponse) {
    return result; // Error response
  }

  const { session, user } = result;
  // Admin logic here
}
```

## Database Queries

### Find user by email

```typescript
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});
```

### Find user by provider account

```typescript
const user = await prisma.user.findUnique({
  where: {
    provider_providerAccountId: {
      provider: "google",
      providerAccountId: "google_sub_123",
    },
  },
});
```

### Update user profile

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    name: "New Name",
    phone: "1234567890",
  },
});
```

## Testing Checklist

- [ ] Navigate to `/login`
- [ ] Click "Continue with Google"
- [ ] Google consent screen appears
- [ ] Sign in with test Google account
- [ ] Redirected to `/dashboard`
- [ ] User name appears in header
- [ ] Profile dropdown shows user image and email
- [ ] Click profile → "Profile" goes to `/profile`
- [ ] Click profile → "Logout" signs out and redirects to home
- [ ] Try accessing protected route without login → redirects to `/login`
- [ ] Protected routes work after login
- [ ] Admin can access `/admin` if role is ADMIN

## Deployment Checklist

- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Update Google OAuth redirect URIs in Google Cloud Console
- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Set all environment variables on hosting platform
- [ ] Run database migrations: `npm run prisma:migrate`
- [ ] Test sign-in on production
- [ ] Verify cookies have Secure flag (HTTPS)
- [ ] Test logout and session clearing
- [ ] Monitor auth errors in logs

## Common Issues & Solutions

| Issue                                    | Solution                                  |
| ---------------------------------------- | ----------------------------------------- |
| "Missing required environment variables" | Update `.env` with OAuth credentials      |
| Redirect URI mismatch                    | Add exact URI to Google Cloud Console     |
| Session not persisting                   | Check SessionProvider is in root layout   |
| Can't access protected routes            | Ensure middleware.ts is configured        |
| Google account not creating user         | Check NEXTAUTH_URL matches request origin |
| Admin routes not protected               | Verify role check in middleware           |

## Architecture Overview

```
User → Login Page → Google OAuth → Callback
                                      ↓
                              Create User (if new)
                                      ↓
                              Generate JWT Token
                                      ↓
                              Set HTTP-only Cookie
                                      ↓
                              Redirect to Dashboard
                                      ↓
                              All requests include session cookie
                                      ↓
                              Middleware validates session
                                      ↓
                              User can access protected routes
```

## Session Flow

1. User clicks "Continue with Google"
2. Redirected to Google OAuth endpoint
3. User authenticates with Google
4. Google redirects back with code
5. NextAuth exchanges code for tokens
6. JWT token created with user data
7. HTTP-only cookie set in browser
8. User session established
9. Automatic token refresh (daily)
10. Token expires after 7 days

## Security Highlights

- **No passwords**: Google handles all authentication
- **HTTP-only cookies**: JavaScript cannot access session cookies
- **Secure in production**: Cookies require HTTPS
- **CSRF protection**: Built-in with NextAuth
- **Session validation**: Every request checks session validity
- **Role-based access**: Admin-only routes protected
- **No sensitive logs**: Passwords and tokens never logged
- **Environment validation**: Missing secrets cause startup failure

## Support & References

- NextAuth.js Docs: https://next-auth.js.org/
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- GOOGLE_OAUTH_SETUP.md: Full setup guide with screenshots
