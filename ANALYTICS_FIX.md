# Analytics Loading Failed - Quick Fix Guide

## Problem

When you try to access the admin analytics dashboard at `/admin/analytics`, you get an error: **"Failed to load analytics"**

## Root Cause

Your user account hasn't been promoted to admin role yet. The analytics API endpoint requires admin privileges.

## Solution: Become Admin in 2 Steps

### Step 1: Restart Your Dev Server

First, make sure your dev server picks up the new environment variable:

```bash
cd "/Users/rishab/Desktop/SCS Project/organic-fertilizer-shop"
npm run dev
```

The server should start on `http://localhost:3000` (or `http://localhost:9000` if you've configured a different port).

### Step 2: Promote Your Account to Admin

**Option A: Using Browser Console (Recommended)**

1. Log in to your account at `/login` (create one if needed)
2. Open your browser's Developer Console:
   - **Windows/Linux:** Press `F12` → Go to "Console" tab
   - **Mac:** Press `Cmd + Option + J`
3. Paste and run this command:

```javascript
fetch("/api/admin/setup", {
  method: "POST",
  headers: {
    "x-setup-secret": "dev-setup-123",
  },
})
  .then((r) => r.json())
  .then((d) => {
    console.log("Admin Setup Result:", d);
    if (d.success) {
      console.log("✅ Successfully promoted to admin!");
      console.log("User:", d.user);
      localStorage.setItem("adminPromoted", "true");
      // Refresh page to see changes
      setTimeout(() => location.reload(), 1000);
    } else {
      console.error("❌ Failed:", d.error);
    }
  });
```

4. Press **Enter** and wait for the response
5. If successful, you'll see: `✅ Successfully promoted to admin!`
6. The page will automatically refresh

**Option B: Using Database Directly**

If you have direct database access, you can promote your user:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Verify Admin Status

After becoming admin, verify it worked:

1. Go to `/admin/analytics`
2. You should now see the analytics dashboard with:
   - 📊 Stats Cards (Revenue, Orders, Customers, Pending)
   - 📊 Orders by Status breakdown
   - 💹 Recent Revenue Chart
   - 🏆 Top Selling Products

## If It Still Doesn't Work

### Check the Console

1. Open Developer Console (F12 → Console tab)
2. Look for error messages
3. Common issues:
   - **"Invalid or missing setup secret"** → Make sure `.env.local` has `ADMIN_SETUP_SECRET=dev-setup-123`
   - **"Not authenticated"** → Make sure you're logged in
   - **"Failed to setup admin"** → Check server logs for database errors

### Restart Everything

```bash
# Kill the dev server (Ctrl+C)
# Delete the node_modules and reinstall
rm -rf node_modules
npm install

# Restart the dev server
npm run dev
```

### Check Your .env.local File

Make sure your `.env.local` file contains:

```
ADMIN_SETUP_SECRET=dev-setup-123
```

## What Changed

We've added:

1. **New API endpoint** `/api/admin/setup` - Safely promotes users to admin in development
2. **Better error messages** - Analytics page now shows detailed error info
3. **Environment variable** - `ADMIN_SETUP_SECRET` for development setup

## Next Steps

Once you're admin and analytics is working:

1. ✅ You can now access `/admin/analytics`
2. ✅ View all business metrics and charts
3. ✅ Filter by time period (7, 30, 90 days)
4. ✅ See top performing products

## Questions?

If you still have issues:

- Check [http://localhost:3000/admin/analytics](http://localhost:3000/admin/analytics) (adjust port if needed)
- Open console and check for any error messages
- Make sure you're logged in first
- Verify `.env.local` has the correct `ADMIN_SETUP_SECRET`
