/**
 * Get the last 4 characters of an ID for display purposes
 * @param id - The ID string to format
 * @returns The last 4 characters of the ID, or the full ID if it's shorter than 4 characters, or "N/A" if the ID is null/undefined
 */
export function getLast4Chars(id: string | null | undefined): string {
  if (!id) return "N/A";
  return id.length >= 4 ? id.slice(-4) : id;
}
