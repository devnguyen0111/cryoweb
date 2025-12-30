/**
 * Date Helper Utilities
 * Provides helper functions for date parsing, formatting, and manipulation
 */

/**
 * Extracts the date part from an ISO datetime string
 * @param isoString - ISO datetime string (e.g., "2024-01-15T10:30:00Z" or "2024-01-15")
 * @returns Date string in YYYY-MM-DD format
 */
export function extractDatePart(isoString: string | null | undefined): string {
  if (!isoString) return "";
  if (isoString.includes("T")) {
    return isoString.split("T")[0];
  }
  return isoString;
}

/**
 * Formats a Date object to YYYY-MM-DD format for input fields
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Formats a Date object to YYYY-MM-DD format
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string and returns it in YYYY-MM-DD format
 * Handles both ISO datetime strings and date-only strings
 * @param dateString - Date string to parse
 * @returns Date string in YYYY-MM-DD format, or empty string if invalid
 */
export function parseAndFormatDate(
  dateString: string | null | undefined
): string {
  if (!dateString) return "";

  // If already in YYYY-MM-DD format, return as is
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  // Extract date part from ISO string
  const datePart = extractDatePart(dateString);
  if (datePart) {
    return datePart;
  }

  // Try to parse as Date
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return formatDateToYYYYMMDD(date);
    }
  } catch {
    // Invalid date
  }

  return "";
}

/**
 * Compares two date strings (ignoring time)
 * @param date1 - First date string
 * @param date2 - Second date string
 * @returns true if dates are the same (ignoring time), false otherwise
 */
export function isSameDate(
  date1: string | null | undefined,
  date2: string | null | undefined
): boolean {
  if (!date1 || !date2) return false;
  const date1Part = extractDatePart(date1);
  const date2Part = extractDatePart(date2);
  return date1Part === date2Part;
}
