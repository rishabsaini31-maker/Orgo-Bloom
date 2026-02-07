import { NextRequest, NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api-utils";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for large images/videos
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user || !isAdmin(user)) {
      throw new ApiError("Unauthorized. Admin access required.", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "image" or "video"

    if (!file) {
      throw new ApiError("No file provided", 400);
    }

    if (!type || !["image", "video"].includes(type)) {
      throw new ApiError("Invalid type. Must be 'image' or 'video'", 400);
    }

    // Validate file type
    const allowedTypes =
      type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
    if (!allowedTypes.includes(file.type)) {
      throw new ApiError(
        `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
        400,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB, received: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        400,
      );
    }
    
    console.log(`Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const filename = `${type}-${timestamp}-${random}.${extension}`;

    // Convert file to buffer for saving
    const buffer = Buffer.from(await file.arrayBuffer());

    let blobUrl: string | null = null;

    // HYBRID: Save to BOTH Blob Storage (if available) AND Local Storage
    // 1. Save to Vercel Blob Storage (production)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import("@vercel/blob");
        const blob = await put(filename, buffer, {
          access: "public",
          contentType: file.type,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        blobUrl = blob.url;
      } catch (blobError) {
        console.warn(
          "Blob storage upload failed, using local storage",
          blobError,
        );
      }
    }

    // 2. Always save to local file system as backup/fallback
    const filepath = join(UPLOAD_DIR, filename);
    try {
      writeFileSync(filepath, buffer);
      // Verify file was written
      const fileExists = existsSync(filepath);
      const fileStats = fileExists ? statSync(filepath) : null;
      
      if (!fileExists || !fileStats || fileStats.size === 0) {
        throw new Error(
          `File verification failed: exists=${fileExists}, size=${fileStats?.size || 0}`,
        );
      }
      console.log(`✓ File saved: ${filepath} (${fileStats.size} bytes)`);
    } catch (localError) {
      console.error(
        `✗ Local file save failed:`,
        localError instanceof Error ? localError.message : localError,
      );
      throw new ApiError(
        `Failed to save file: ${localError instanceof Error ? localError.message : "Unknown error"}`,
        500,
      );
    }

    // Return Blob URL if available, otherwise local URL
    const publicUrl = blobUrl || `/uploads/${filename}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        filename: filename,
        size: buffer.length,
        contentType: file.type,
        savedTo: blobUrl ? "blob-and-local" : "local",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
