import { NextRequest, NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { authenticateRequest, isAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api-utils";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
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
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400,
      );
    }

    // Use Vercel Blob in production, local storage in development
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production: Use Vercel Blob Storage
      const { put } = await import("@vercel/blob");

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = file.name.split(".").pop();
      const filename = `${type}-${timestamp}-${random}.${extension}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const blob = await put(filename, buffer, {
        access: "public",
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return NextResponse.json(
        {
          success: true,
          url: blob.url,
          filename: filename,
        },
        { status: 201 },
      );
    } else {
      // Development: Use local file system
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = file.name.split(".").pop();
      const filename = `${type}-${timestamp}-${random}.${extension}`;
      const filepath = join(UPLOAD_DIR, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      writeFileSync(filepath, buffer);

      const publicUrl = `/uploads/${filename}`;

      return NextResponse.json(
        {
          success: true,
          url: publicUrl,
          filename: filename,
        },
        { status: 201 },
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
