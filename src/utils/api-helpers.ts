/**
 * API Helper Utilities
 * Provides helper functions for common API patterns like error handling and empty responses
 */

import { isAxiosError } from "axios";
import type { PaginatedResponse } from "@/api/types";

/**
 * Creates an empty paginated response with default metadata
 * @param pageSize - Optional page size (default: 10)
 * @returns Empty PaginatedResponse
 */
export function createEmptyPaginatedResponse<T>(
  pageSize: number = 10
): PaginatedResponse<T> {
  return {
    code: 200,
    message: "",
    data: [],
    metaData: {
      pageNumber: 1,
      pageSize,
      totalCount: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    },
  };
}

/**
 * Creates a simple empty response with minimal metadata
 * Used for backward compatibility with some API responses
 * @returns Empty response with minimal metadata
 */
export function createEmptyResponse<T>(): {
  data: T[];
  metaData: { totalCount: number; totalPages: number };
} {
  return {
    data: [],
    metaData: { totalCount: 0, totalPages: 0 },
  };
}

/**
 * Fetches data with automatic 404 error handling
 * Returns empty paginated response if 404 error occurs
 * @param request - Function that returns a promise for the API request
 * @param pageSize - Optional page size for empty response (default: 10)
 * @returns PaginatedResponse or empty response on 404
 */
export async function fetchWith404Fallback<T>(
  request: () => Promise<PaginatedResponse<T>>,
  pageSize: number = 10
): Promise<PaginatedResponse<T>> {
  try {
    return await request();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return createEmptyPaginatedResponse<T>(pageSize);
    }
    throw error;
  }
}

/**
 * Fetches data with automatic 404 error handling (simple version)
 * Returns simple empty response if 404 error occurs
 * @param request - Function that returns a promise for the API request
 * @returns Response with data and minimal metadata, or empty response on 404
 */
export async function fetchWith404FallbackSimple<T>(
  request: () => Promise<{ data: T[]; metaData: any }>
): Promise<{ data: T[]; metaData: any }> {
  try {
    return await request();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return createEmptyResponse<T>();
    }
    throw error;
  }
}
