import { NextRequest, NextResponse } from "next/server";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function GET(request: NextRequest) {
  try {
    const dirExists = existsSync(UPLOAD_DIR);
    let files: any[] = [];

    if (dirExists) {
      const fileList = readdirSync(UPLOAD_DIR);
      files = fileList
        .filter((f) => f !== ".gitkeep")
        .map((f) => {
          const filepath = join(UPLOAD_DIR, f);
          const stats = statSync(filepath);
          return {
            name: f,
            size: stats.size,
            path: `/uploads/${f}`,
          };
        });
    }

    return NextResponse.json({
      success: true,
      uploadDirPath: UPLOAD_DIR,
      dirExists,
      filesCount: files.length,
      files,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}
