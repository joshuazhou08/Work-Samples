/**
 * Format a number or string as USD currency
 * @param amount - The amount to format (number or numeric string)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numAmount);
};

/**
 * Format a date string as a readable date
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a date string as a time
 * @param dateString - ISO date string
 * @returns Formatted time string (e.g., "02:30 PM")
 */
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format a date string as both date and time
 * @param dateString - ISO date string
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string): string => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

/**
 * Format a duration in minutes into hours (e.g., 90 -> "1.5h")
 */
export const formatDuration = (minutes: number): string => {
  return `${(minutes / 60).toFixed(1)}h`;
};
