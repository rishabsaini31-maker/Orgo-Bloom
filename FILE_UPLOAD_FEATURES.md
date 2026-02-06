# File Upload Features Implementation

## Overview

Added comprehensive file upload support for product images and videos in the Orgobloom e-commerce platform.

## Features Added

### 1. **Product Image File Uploads (3-5 images per product)**

- Admin can upload 3-5 images per product directly from the form
- Uploaded images are stored in `/public/uploads/`
- Support for PNG, JPG, and WebP formats
- Each image limited to 10MB
- Image gallery view on product cards with:
  - Navigation arrows to browse images
  - Image counter (e.g., "1/3")
  - Hover effects to show navigation
  - First image loads by default

### 2. **Admin Product Form Enhancements**

- New drag-and-drop image upload area
- Multiple file selection support
- Image preview thumbnail grid
- Remove individual images with × button
- Progress indicator during upload
- Visual feedback for upload status

### 3. **Video File Upload Support**

- Admin Settings page now supports both YouTube URLs and file uploads
- Toggle between "YouTube URL" and "Upload Video File"
- Support for MP4, WebM, and MOV formats
- 10MB file size limit
- Video preview with player controls

### 4. **Home Page Video Display**

- Automatic detection of video type (YouTube vs uploaded file)
- YouTube videos render in iframe
- Uploaded videos render with native HTML5 video player
- Auto-play and mute support for both types
- Loop functionality for continuous playback

### 5. **API Endpoint**

- `POST /api/upload` - Handles file uploads for both images and videos
- Admin-only authentication required
- File type validation (images vs videos)
- Randomized filename generation for security
- Returns public URL for uploaded files

## File Structure

```
public/
├── uploads/          # Uploaded files directory (created automatically)
│   └── .gitkeep      # To track directory in git
app/
├── api/
│   └── upload/
│       └── route.ts  # File upload endpoint
├── admin/
│   ├── products/
│   │   └── new/
│   │       └── page.tsx  # Updated with image upload UI
│   └── settings/
│       └── page.tsx  # Updated with video upload
└── page.tsx          # Updated to handle video types
components/
└── ProductCard.tsx   # Updated with image gallery
```

## Usage

### For Admins - Adding Products with Multiple Images

1. Go to Admin → Products → Add New Product
2. Fill in product details (name, price, etc.)
3. **Product Images section:**
   - Click the upload area or drag and drop images
   - Select 3-5 images (PNG, JPG, or WebP)
   - View uploaded images with thumbnail previews
   - Remove unwanted images with the × button
   - Up to 5 images displayed in gallery on product card
4. Submit form to create product

### For Admins - Uploading Home Page Video

1. Go to Admin → Settings
2. Choose upload method:
   - **YouTube URL**: Paste YouTube embed URL
   - **Upload Video File**: Upload MP4, WebM, or MOV (max 10MB)
3. Preview video before saving
4. Click Save Settings
5. Home page automatically displays video

### For Customers - Browsing Product Images

1. Browse products on Products page
2. Hover over product cards to see arrow navigation buttons
3. Click arrows or wait for image counter (1/3) to see multiple images
4. Click product card to view details

## Technical Details

### Security

- Admin-only file uploads via authentication check
- File type validation before saving
- Randomized filenames to prevent directory traversal
- Size limits enforced (10MB max)
- Files stored in public directory for web serving

### Performance

- Client-side image preview without upload
- Optimized file storage with random names
- Supports lazy loading of product images
- Native video element supports adaptive bitrate

### Database

- Product schema already supports `images[]` array
- Settings table stores video URL (file path or YouTube URL)
- Automatic format detection on home page

## Troubleshooting

### Images not uploading

- Check file size (max 10MB)
- Verify file format (PNG, JPG, WebP)
- Check browser console for error details
- Ensure admin is authenticated

### Video not playing

- Verify file format (MP4, WebM, MOV)
- Check file size (up to 10MB)
- Test video file plays locally first
- For YouTube: verify embed URL format

### Files not visible

- Clear browser cache
- Check `/public/uploads/` directory exists
- Verify file permissions on server
- Restart development server

## Future Enhancements

- Image cropping/resizing before upload
- Video thumbnail extraction
- Image optimization/compression
- CDN integration for file serving
- Batch file uploads
- Progress bar for large files
