import { NextRequest, NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api-utils";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB for large videos and images
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

    console.log(
      `Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    );

    // Super simple basename: only letters and numbers
    const timestamp = Date.now();
    const baseName = `file${timestamp}`;
    // Get extension for local file save
    const originalExt = file.name.split(".").pop()?.toLowerCase() || "";
    const extension = originalExt.replace(/[^a-z0-9]/g, "") || "bin";

    const blobName = baseName; // no dots or special chars for Blob
    const localFilename = `${baseName}.${extension}`;

    console.log(`Generated blob name: ${blobName}`);

    // Convert file to buffer for saving
    const buffer = Buffer.from(await file.arrayBuffer());

    let blobUrl: string | null = null;
    let localSaved = false;

    // Check if we're in production (Vercel)
    const isProduction = process.env.VERCEL === "1";

    // 1. Try Vercel Blob Storage (production)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        console.log(
          `Attempting Blob upload: ${blobName}, contentType: ${file.type}, size: ${buffer.length} bytes`,
        );

        const { put } = await import("@vercel/blob");

        // Create a proper Blob object from buffer with correct content type
        const blob = new Blob([buffer], { type: file.type });

        // Upload to Vercel Blob - use blob object instead of file
        const result = await put(blobName, blob, {
          access: "public",
          contentType: file.type,
        });

        blobUrl = result.url;
        console.log(`✓ File uploaded to Blob Storage: ${result.url}`);
      } catch (blobError: any) {
        console.error("Blob storage upload failed:", blobError);
        console.error("Error details:", {
          message: blobError?.message,
          cause: blobError?.cause,
          stack: blobError?.stack,
          name: blobError?.name,
        });
        throw new ApiError(
          `Blob upload failed: ${blobError?.message || "Unknown error"}. Please check Vercel logs for details.`,
          500,
        );
      }
    } else if (isProduction) {
      // In production without Blob token - cannot proceed
      throw new ApiError(
        "Cloud storage not configured. Please enable Vercel Blob Storage in your project settings.",
        503,
      );
    } else {
      // 2. Local file system (development only)
      const filepath = join(UPLOAD_DIR, localFilename);
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
        localSaved = true;
        console.log(
          `✓ File saved locally: ${filepath} (${fileStats.size} bytes)`,
        );
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
    }

    // Return Blob URL if available, otherwise local URL
    const publicUrl = blobUrl || `/uploads/${localFilename}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        filename: blobUrl ? blobName : localFilename,
        size: buffer.length,
        contentType: file.type,
        savedTo: blobUrl ? "blob-storage" : "local-storage",
        environment: isProduction ? "production" : "development",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
