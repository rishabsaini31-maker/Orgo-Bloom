# Google OAuth Fix - Step by Step Guide

## Problem

Google OAuth popup opens but clicking "Continue" does nothing and sign-in doesn't complete.

## Root Cause

The database schema was missing required NextAuth models for OAuth authentication:

- Missing `Account` model for OAuth provider data
- Incorrect `Session` model structure
- Missing `VerificationToken` model

## Solution Applied

### 1. Updated Database Schema

Added/updated three critical models in `prisma/schema.prisma`:

#### a. Account Model (NEW)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}
```

#### b. Session Model (UPDATED)

Changed from custom session management to NextAuth format:

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}
```

#### c. VerificationToken Model (NEW)

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

#### d. User Model (UPDATED)

- Changed `name` from required to optional (`String?`)
- Changed `emailVerified` from `@default(now())` to optional (`DateTime?`)
- Added `accounts` relation
- Removed `@@unique([email, provider])` constraint
- Added `accounts Account[]` relation

### 2. Updated Auth Configuration

**File:** `lib/auth.ts`

#### Fixed Google Provider config:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code",
    },
  },
});
```

#### Improved signIn callback:

- Better error handling
- Proper logging for debugging
- Allows OAuth for new users
- Prevents OAuth if email already has password login

## Steps to Apply the Fix

### Step 1: Generate and Apply Migration

Run these commands in your terminal:

```bash
# Generate a new migration
npx prisma migrate dev --name add-nextauth-models

# Push changes to database (alternative if migrate fails)
# npx prisma db push
```

### Step 2: Restart Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Step 3: Test Google OAuth

1. Go to http://localhost:9000/login
2. Click on "Continue with Google"
3. Select your Google account
4. Grant permissions
5. You should be redirected back and logged in

## Verification

After applying the fix, verify these work:

### ✅ Google OAuth Flow:

- [ ] Popup opens
- [ ] Can select Google account
- [ ] Permissions page loads
- [ ] Redirects back to app after clicking "Continue"
- [ ] User is logged in
- [ ] Session persists on page refresh

### ✅ Database Check:

Run this to verify data is being created:

```bash
npx prisma studio
```

Check that these tables have data:

- `users` - Your user record
- `accounts` - OAuth account link
- `sessions` - Active session

### ✅ Email Login Still Works:

- [ ] Email/password login works
- [ ] Can't use OAuth with email that has password

## Troubleshooting

### If OAuth still doesn't work:

1. **Clear browser data:**
   - Clear cookies for localhost:9000
   - Clear cache
   - Try incognito mode

2. **Check environment variables:**

   ```bash
   # Verify these are set in .env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:9000
   ```

3. **Check Google Console settings:**
   - Go to: https://console.cloud.google.com
   - Navigate to: APIs & Services > Credentials
   - Click on your OAuth 2.0 Client ID
   - Verify Authorized redirect URIs includes:
     - `http://localhost:9000/api/auth/callback/google`

4. **Check server logs:**
   Look for these in your terminal:

   ```
   [AUTH] User signed in: email@domain.com
   ```

   Or errors like:

   ```
   [next-auth] error
   ```

5. **Database connection:**
   ```bash
   # Test database connection
   npx prisma db pull
   ```

### Common Error Messages:

| Error                      | Solution                              |
| -------------------------- | ------------------------------------- |
| "OAuth callback error"     | Check redirect URIs in Google Console |
| "Email already registered" | Email has password, can't use OAuth   |
| "Session not found"        | Clear cookies, try again              |
| "CSRF token mismatch"      | Clear cookies and cache               |

## What Changed Under the Hood

### Before:

- OAuth data had nowhere to be stored
- Session model incompatible with NextAuth
- Sign-in would fail silently
- No proper OAuth state management

### After:

- OAuth data stored in `Account` model
- Sessions properly managed by NextAuth
- Complete OAuth flow support
- Proper error handling and logging

## Testing Commands

```bash
# 1. Check if migration was successful
npx prisma migrate status

# 2. Open Prisma Studio to view data
npx prisma studio

# 3. Check logs in real-time
npm run dev

# 4. Reset database if needed (CAUTION: deletes all data)
npx prisma migrate reset
```

## Additional Notes

- Old session data will be incompatible and should be cleared
- Users who signed up before this fix will need to sign in again
- The fix maintains backward compatibility with email/password login
- No changes needed to frontend code

## Support

If issues persist:

1. Check the terminal output for `[AUTH]` logs
2. Check browser console for errors
3. Verify Google OAuth credentials are correct
4. Ensure database migrations ran successfully

---

**Important:** After running migrations, existing sessions will be invalid. All users will need to log in again.
