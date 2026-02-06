# File Upload Features - Testing Guide

## Quick Start

### 1. Access Admin Panel

1. Go to **http://localhost:9000/admin/login**
2. Login with:
   - Email: `omsable5426@gmail.com`
   - Password: `orgobloom2025`

## Test Product Image Uploads

### Add New Product with Multiple Images

1. Click **Products** → **Add New Product**
2. Fill in product details:
   - Name: "Test Product with Images"
   - Price: 599
   - Weight: 5 kg
   - Stock: 50
   - Description: "Test product with multiple images"
3. Scroll to "Product Images (3-5 images recommended)" section
4. Upload 2-3 images (drag & drop or click to select)
   - Try different formats: JPG, PNG, WebP
   - You can use images from Unsplash or local files
5. View uploaded images with thumbnail previews
6. Click **Create Product**
7. Go to **Products** page to see the product with image gallery

### Test Image Gallery

1. On the Products page, hover over the product card
2. You should see:
   - Navigation arrows (< and >)
   - Image counter (1/2, for example)
   - Multiple images cycling through
3. Click arrows to navigate between images

## Test Home Page Video Upload

### Option 1: YouTube Video

1. Go to **Admin** → **Settings**
2. Select **YouTube URL** radio button
3. Paste a YouTube embed URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`
4. See live preview
5. Click **Save Settings**
6. Go to home page and watch the video play

### Option 2: Upload Video File

1. Go to **Admin** → **Settings**
2. Select **Upload Video File** radio button
3. Click to upload a video file (MP4/WebM, max 10MB)
   - Use a short test video (30-60 seconds is fine)
4. See preview with video player
5. Click **Save Settings**
6. Go to home page
7. Video should auto-play with mute enabled

## Expected Behavior

### Product Images

✅ Images upload successfully to `/public/uploads/`
✅ Thumbnail previews show in admin form
✅ Images appear on product cards
✅ Gallery navigation works with arrow buttons
✅ Image counter shows current position
✅ Can remove individual images
✅ Product displays first image by default

### Videos

✅ YouTube videos display in iframe format
✅ Uploaded MP4/WebM videos play with native player
✅ Auto-play works (with mute required on web)
✅ Loop functionality works
✅ Preview shows before saving

## Troubleshooting

### Images not showing

- Verify files were uploaded to `/public/uploads/` directory
- Check file permissions
- Clear browser cache (Cmd+Shift+R on Mac)
- Check browser console for errors

### Upload fails with error

- Confirm file size is under 10MB
- Verify file format (JPG, PNG, or WebP for images)
- Check you're logged in as admin
- Try a different browser

### Video not playing on home page

- For YouTube: Verify URL format is correct
- For file upload: Check video format (MP4, WebM, MOV)
- Try refreshing the page
- Check browser console for error messages

## File Locations

Uploaded files are stored at: `/public/uploads/`

View uploaded files in responsive file browser:

- Go to http://localhost:9000/uploads/
- See all uploaded images and videos

## Next Steps

1. **Batch Testing**: Create multiple products with different image counts (1, 3, 5 images)
2. **Format Testing**: Test different image formats (JPG, PNG, WebP)
3. **Video Testing**: Try different video formats/sizes
4. **Performance**: Test with larger files near the 10MB limit
5. **Mobile**: Test image gallery on mobile devices
