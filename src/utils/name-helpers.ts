/**
 * Helper functions for handling names (firstName + lastName)
 */

/**
 * Combines firstName and lastName into a full name string
 */
export function getFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  if (!firstName && !lastName) return "";
  if (!firstName) return lastName || "";
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`.trim();
}

/**
 * Gets full name from an object with firstName and lastName properties
 * Also supports legacy fullName property for backward compatibility
 */
export function getFullNameFromObject(
  obj?: { 
    firstName?: string | null; 
    lastName?: string | null;
    fullName?: string | null; // Legacy support
  } | null
): string {
  if (!obj) return "";
  // Try firstName + lastName first
  if (obj.firstName || obj.lastName) {
    return getFullName(obj.firstName, obj.lastName);
  }
  // Fallback to legacy fullName
  if (obj.fullName) {
    return obj.fullName;
  }
  return "";
}

/**
 * Splits a full name string into firstName and lastName
 * (Simple implementation - assumes last word is lastName, rest is firstName)
 */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  if (!fullName || !fullName.trim()) {
    return { firstName: "", lastName: "" };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, parts.length - 1).join(" ");
  return { firstName, lastName };
}

