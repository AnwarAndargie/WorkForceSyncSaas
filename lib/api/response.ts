import { NextResponse } from "next/server";

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  meta?: ApiResponse<T>["meta"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string,
  field?: string,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(code && { code }),
        ...(field && { field }),
        ...(details && { details }),
      },
    },
    { status }
  );
}

export function handleDatabaseError(error: any): NextResponse<ApiResponse> {
  console.error("Database error:", error);

  if (error.code === "ER_DUP_ENTRY") {
    return createErrorResponse(
      "A record with this information already exists",
      409,
      "DUPLICATE_ENTRY"
    );
  }

  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return createErrorResponse(
      "Referenced record does not exist",
      400,
      "INVALID_REFERENCE"
    );
  }

  if (error.name === "DrizzleError") {
    return createErrorResponse(
      "Invalid data provided",
      400,
      "VALIDATION_ERROR",
      undefined,
      error.message
    );
  }

  return createErrorResponse(
    "An unexpected database error occurred",
    500,
    "DATABASE_ERROR"
  );
}

export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (
      !body[field] ||
      (typeof body[field] === "string" && body[field].trim() === "")
    ) {
      return `${field} is required`;
    }
  }
  return null;
}

export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
