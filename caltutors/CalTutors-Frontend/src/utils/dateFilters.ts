/**
 * Get the local date string (YYYY-MM-DD) from an ISO datetime string
 * This respects the user's timezone, not UTC
 *
 * @param dateTimeString - ISO datetime string (e.g., "2024-01-15T10:00:00Z")
 * @returns Local date string in YYYY-MM-DD format
 */
export const getLocalDateString = (dateTimeString: string): string => {
  const dateTime = new Date(dateTimeString);
  const year = dateTime.getFullYear();
  const month = String(dateTime.getMonth() + 1).padStart(2, "0");
  const day = String(dateTime.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Check if a datetime falls within a date range (inclusive)
 * Comparison is done in the user's local timezone
 *
 * @param dateTimeString - ISO datetime string to check
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @returns True if the datetime's local date is within the range
 */
export const isDateInRange = (
  dateTimeString: string,
  startDate: string,
  endDate: string
): boolean => {
  const localDate = getLocalDateString(dateTimeString);
  return localDate >= startDate && localDate <= endDate;
};

/**
 * Filter an array of items by date range based on a date field
 *
 * @param items - Array of items to filter
 * @param dateFieldGetter - Function to get the datetime string from an item
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @returns Filtered array
 */
export function filterByDateRange<T>(
  items: T[],
  dateFieldGetter: (item: T) => string,
  startDate: string,
  endDate: string
): T[] {
  return items.filter((item) => {
    const dateTimeString = dateFieldGetter(item);
    return isDateInRange(dateTimeString, startDate, endDate);
  });
}
