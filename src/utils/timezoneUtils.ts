/**
 * Timezone conversion utilities
 * All bookings are stored in UTC in the database
 * This module handles conversion between local time and UTC
 */

/**
 * Convert a local time (from user input) to UTC Date
 * @param localDateString - Date in YYYY-MM-DD format
 * @param localTimeString - Time in HH:mm format (in user's local timezone)
 * @returns Date object
 */
export function localTimeToUTC(localDateString: string, localTimeString: string): Date {
  // Creating a Date from ISO string without 'Z' assumes local time
  return new Date(`${localDateString}T${localTimeString}`);
}

/**
 * Convert UTC time to local time components for form inputs
 * @param utcDate - Date object
 * @returns Object with date and time strings in local timezone format
 */
export function utcToLocalTime(utcDate: Date): { date: string; time: string } {
  const d = new Date(utcDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

/**
 * Get the current time as a UTC Date
 * @returns Current time
 */
export function getNowUTC(): Date {
  return new Date();
}

/**
 * Format UTC time for display in local timezone
 * @param utcDate - Date object or ISO string
 * @returns Formatted time string (HH:mm)
 */
export function formatLocalTime(utcDate: Date | string): string {
  const d = new Date(utcDate);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Format UTC date for display in local timezone
 * @param utcDate - Date object or ISO string
 * @param options - Optional formatting options
 * @returns Formatted date string
 */
export function formatLocalDate(
  utcDate: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(utcDate);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return d.toLocaleDateString([], options || defaultOptions);
}

/**
 * Format UTC datetime for display in local timezone
 * @param utcDate - Date object or ISO string
 * @returns Formatted datetime string
 */
export function formatLocalDateTime(utcDate: Date | string): string {
  return `${formatLocalDate(utcDate)} ${formatLocalTime(utcDate)}`;
}
