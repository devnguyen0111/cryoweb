/**
 * Formatting Utilities
 * Provides helper functions for formatting numbers, currency, etc.
 */

/**
 * Formats a number as currency
 * @param value - Number to format
 * @param currency - Currency code (default: "VND")
 * @param locale - Locale string (default: "vi-VN")
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = "VND",
  locale: string = "vi-VN"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Formats a number with thousand separators
 * @param value - Number to format
 * @param locale - Locale string (default: "vi-VN")
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale: string = "vi-VN"): string {
  return new Intl.NumberFormat(locale).format(value);
}
