/**
 * Formats a number as currency.
 * @param {number} amount - The amount to format.
 * @returns {string} - The formatted currency string.
 */
export function formatCurrency(amount) {
  const locale = import.meta.env.VITE_LOCALE || "en-IN";
  const currency = import.meta.env.VITE_CURRENCY || "INR";

  const hasFraction = Math.abs(amount % 1) > 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(amount);
}

/**
 * Formats a date as a localized string.
 * @param {Date|string} date - The date to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date) {
  const locale = import.meta.env.VITE_LOCALE || "en-US";

  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsedDate);
}

/**
 * Formats a date and time as a localized string.
 * @param {Date|string} dateTime - The date and time to format.
 * @returns {string} - The formatted date and time string.
 */
export function formatDateTime(dateTime) {
  const locale = import.meta.env.VITE_LOCALE || "en-US";

  const parsedDateTime =
    typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    // second: '2-digit',
  }).format(parsedDateTime);
}

/**
 * Formats a number as a percentage.
 * @param {number} value - The number to format.
 * @returns {string} - The formatted percentage string.
 */
export function formatPercentage(value) {
  const locale = import.meta.env.VITE_LOCALE || "en-US";
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
