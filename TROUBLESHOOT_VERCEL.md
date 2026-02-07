# Troubleshooting Vercel Deployment Issues

## Issue 1: Videos Not Appearing on Vercel

### Possible Causes

1. **No videos in database** - Settings table might be empty
2. **Videos stored locally** - Uploaded before Blob Storage was configured
3. **API route not fetching correctly** - Check function logs

### Solution Steps

#### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to **Functions** tab
4. Look for errors in:
   - `/api/admin/settings` (GET)
   - `/` (homepage)
5. Check if you see "Error fetching videos" or similar

#### Step 2: Verify Database Has Videos

The videos are stored in the `settings` table with key `homepage_videos`.

**Check this:**
1. Go to your Neon database dashboard
2. Run this query:
```sql
SELECT * FROM settings WHERE key = 'homepage_videos';
```

**If empty or missing:**
- Videos were never saved
- Need to upload videos again through admin panel

#### Step 3: Check for Local File URLs

If you see URLs like `/uploads/video-xxxxx.mp4` in database:
- These are LOCAL file paths (won't work on Vercel)
- Need to delete these and re-upload using Blob Storage

**Fix it:**
1. Go to your deployed site admin: `https://your-site.vercel.app/admin/settings`
2. Delete old videos
3. Upload new videos (will use Blob Storage)
4. Save settings

---

## Issue 2: "The string did not match the expected pattern"

This error occurs when uploading files to Vercel Blob Storage.

### Latest Fix (Commit: edf92bc)

We changed the upload logic to:
- Create a proper `Blob` object from buffer
- Use ultra-simple filename: `f1770464123456.mp4` (no hyphens, no special chars)
- Pass `contentType` parameter
- Strip non-alphanumeric from file extensions

### Verify Blob Storage Configuration

#### 1. Enable Blob Storage on Vercel

**Is Blob Storage Connected?**
1. Go to Vercel Dashboard → Your Project
2. Click **Storage** tab (left sidebar)
3. Look for **Blob** in the list

**If NOT connected:**
1. Click **Create Database**
2. Select **Blob**
3. Click **Create**
4. It will auto-configure `BLOB_READ_WRITE_TOKEN`

**If connected but uploads still fail:**
- Check it's connected to the right project
- Try disconnecting and reconnecting

#### 2. Check Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Verify these exist:
   - `BLOB_READ_WRITE_TOKEN` (should be auto-added by Vercel)
   - `DATABASE_URL` (your Neon PostgreSQL)
   - `JWT_SECRET`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

**If `BLOB_READ_WRITE_TOKEN` is missing:**
- Blob Storage not properly connected
- Go to Storage tab and reconnect

#### 3. Redeploy After Blob Setup

After connecting Blob Storage:
1. Go to **Deployments**
2. Find the latest deployment
3. Click **•••** menu → **Redeploy**
4. Or just push a new commit to trigger deployment

---

## Testing the Fix

### Test Upload in Production

1. Go to `https://your-site.vercel.app/admin/login`
2. Login with admin credentials
3. Go to Settings (`/admin/settings`)
4. Try uploading a small video (< 10MB first)
5. Check Vercel function logs for errors

### Check Function Logs in Real-Time

1. Open Vercel Dashboard → Deployments → Latest
2. Go to **Functions** tab
3. Find `/api/upload` function
4. Click to see logs
5. Upload a video and watch logs appear

**Expected success logs:**
```
Starting upload: test.mp4 (5.23MB)
Generated filename: f1770464123456.mp4
Attempting Blob upload: f1770464123456.mp4, contentType: video/mp4, size: 5483274 bytes
✓ File uploaded to Blob Storage: https://xxxxx.public.blob.vercel-storage.com/f1770464123456.mp4
```

**If error appears:**
- Copy the full error message
- Check the stack trace
- Error might indicate:
  - Blob Storage not configured
  - Token invalid
  - Pathname validation failed (should be fixed now)

---

## Common Error Messages

### "Cloud storage not configured"
**Cause:** `BLOB_READ_WRITE_TOKEN` environment variable missing
**Fix:** Enable Blob Storage in Vercel dashboard (see above)

### "Blob upload failed: The string did not match the expected pattern"
**Cause:** Filename format not accepted by Vercel Blob API
**Fix:** Latest commit (edf92bc) should fix this - redeploy if needed

### "Dynamic server usage: Route couldn't be rendered statically"
**Cause:** Normal behavior - these routes use `headers()` which makes them dynamic
**Fix:** No fix needed - this is expected and not an error

### "Max serverless function size exceeded"
**Cause:** Too many files in `/public/uploads/` being bundled
**Fix:** Already fixed - `.vercelignore` excludes `public/uploads/`

---

## Database Schema Check

Ensure your `settings` table has the correct structure:

```sql
-- Check table structure
\d settings;

-- Should have:
-- - id (String)
-- - key (String, unique)
-- - value (Text)
-- - videos (String[])
-- - updatedAt (DateTime)
```

If `videos` column is missing:
```sql
ALTER TABLE settings ADD COLUMN videos TEXT[] DEFAULT '{}';
```

---

## Quick Checklist

Before reporting an issue, verify:

- [ ] Blob Storage is connected in Vercel dashboard
- [ ] `BLOB_READ_WRITE_TOKEN` exists in environment variables
- [ ] Latest deployment (commit edf92bc or later) is live
- [ ] Tried uploading a small test file (< 10MB)
- [ ] Checked Vercel function logs for detailed error
- [ ] Database has `settings` table with `videos` column
- [ ] Cleared browser cache / used incognito mode
- [ ] Admin user is properly authenticated

---

## Still Not Working?

### Get Detailed Logs

Run this in Vercel CLI (requires `vercel` installed globally):

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Pull logs
vercel logs https://your-project.vercel.app
```

### Check Deployment Status

```bash
# Check if latest commit is deployed
vercel ls

# Redeploy manually
vercel --prod
```

### Contact Support

If all else fails, check:
1. Vercel function logs (most detailed)
2. Browser console (client-side errors)
3. Network tab (API response codes)

Provide these when asking for help:
- Full error message from Vercel logs
- Screenshot of Blob Storage dashboard
- Screenshot of Environment Variables
- The filename that failed to upload
