import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation error",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 },
  );
}

export function successResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>,
) {
  const responseHeaders = new Headers();

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
  }

  return NextResponse.json(data, { status, headers: responseHeaders });
}
