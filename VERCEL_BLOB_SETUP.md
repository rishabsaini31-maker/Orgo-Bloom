# Vercel Blob Storage Setup Guide

This guide explains how to configure Vercel Blob Storage for image and video uploads in production.

## Why Vercel Blob Storage?

In production, Vercel's serverless functions are read-only and can't write to the filesystem. All uploads must use Vercel Blob Storage.

## Setup Steps

### 1. Enable Blob Storage on Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (Orgo-Bloom)
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Blob** from the storage options
6. Click **Create** to provision Blob Storage

### 2. Get Your Blob Token

Vercel will automatically add the `BLOB_READ_WRITE_TOKEN` environment variable to your project. You can verify it:

1. Go to **Settings** → **Environment Variables**
2. Look for `BLOB_READ_WRITE_TOKEN` (should be automatically added)
3. If missing, go back to **Storage** tab and reconnect the Blob store

### 3. Deploy the Application

Once Blob Storage is configured:

```bash
git push origin main
```

Vercel will automatically deploy with Blob Storage enabled.

## Testing Uploads

### In Development (localhost:9000)

- Uses local filesystem at `public/uploads/`
- No Blob Storage needed
- Files saved directly to disk

### In Production (Vercel)

- Requires `BLOB_READ_WRITE_TOKEN` environment variable
- Files uploaded to Vercel Blob Storage
- Returns permanent URLs like: `https://xxxxx.public.blob.vercel-storage.com/uploads/video-xxxxx.mp4`

## Upload Limits

- **Max file size**: 150MB per file
- **Timeout**: 10 minutes (600 seconds)
- **Allowed image types**: PNG, JPEG
- **Allowed video types**: MP4, WebM, QuickTime (MOV)

## Troubleshooting

### Error: "The string did not match the expected pattern"

**Fixed in latest version**. This was caused by:

- Non-URL-safe characters in filenames
- Missing the `token` parameter when not using default env vars
- Incorrect blob path format

**Solution**:

- Filenames are now sanitized (alphanumeric only)
- Uses `uploads/` folder structure
- Removed explicit token parameter (uses default env var)

### Error: "Cloud storage not configured"

This means the app is running on Vercel but `BLOB_READ_WRITE_TOKEN` is not set.

**Solution**:

1. Enable Blob Storage in Vercel dashboard (see Step 1 above)
2. Redeploy the application

### Error: "Failed to upload to cloud storage"

Check Vercel function logs for detailed error message:

1. Go to **Deployments** in Vercel dashboard
2. Click on latest deployment
3. Go to **Functions** tab
4. Check logs for `/api/upload` function

## File URLs

### Development

```
http://localhost:9000/uploads/video-1234567890-abc123.mp4
```

### Production (Blob Storage)

```
https://xxxxx.public.blob.vercel-storage.com/uploads/video-1234567890-abc123.mp4
```

## Cost

Vercel Blob Storage pricing:

- **Hobby plan**: 100GB storage, 100GB bandwidth/month (FREE)
- **Pro plan**: 1TB storage, 1TB bandwidth/month (included)

For most use cases, the free tier is sufficient for product images and homepage videos.

## Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Blob Storage API Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- [Vercel Storage Pricing](https://vercel.com/docs/storage/vercel-blob#pricing)
