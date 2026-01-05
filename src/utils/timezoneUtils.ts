/**
 * Timezone conversion utilities
 * All bookings are stored in UTC in the database
 * This module handles conversion between local time and UTC
 */

/**
 * Convert a local time (from user input) to UTC Date
 * @param localDateString - Date in YYYY-MM-DD format
 * @param localTimeString - Time in HH:mm format (in user's local timezone)
 * @returns Date object in UTC
 */
export function localTimeToUTC(localDateString: string, localTimeString: string): Date {
  // Create a date string in local time
  const localDateTimeString = `${localDateString}T${localTimeString}:00`;

  // Parse as local time - the Date constructor interprets this as local timezone
  const localDate = new Date(localDateTimeString);

  // The Date object is already in UTC internally, we just return it
  // No conversion needed - JavaScript Date already stores timestamps in UTC
  return localDate;
}

/**
 * Convert UTC time to local time for display
 * @param utcDate - Date object in UTC
 * @returns Object with date and time strings in local timezone
 */
export function utcToLocalTime(utcDate: Date): { date: string; time: string } {
  // The Date object already handles timezone conversion automatically
  // when we extract date/time components
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  const hours = String(utcDate.getHours()).padStart(2, '0');
  const minutes = String(utcDate.getMinutes()).padStart(2, '0');

  const date = `${year}-${month}-${day}`;
  const time = `${hours}:${minutes}`;

  return { date, time };
}

/**
 * Get the current time as a UTC Date
 * @returns Current time in UTC
 */
export function getNowUTC(): Date {
  return new Date();
}

/**
 * Convert UTC time to local and format as time string
 * @param utcDate - Date object in UTC
 * @returns Formatted time string (HH:mm) in local timezone
 */
export function formatLocalTime(utcDate: Date | string): string {
  const d = new Date(utcDate);

  // Use toLocaleTimeString which automatically handles timezone conversion
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convert UTC time to local and format as date string
 * @param utcDate - Date object in UTC
 * @param options - Optional formatting options
 * @returns Formatted date string in local timezone
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

  // toLocaleDateString automatically handles timezone conversion
  return d.toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Convert UTC time to local and format as full datetime string
 * @param utcDate - Date object in UTC
 * @returns Formatted datetime string in local timezone
 */
export function formatLocalDateTime(utcDate: Date | string): string {
  const date = formatLocalDate(utcDate);
  const time = formatLocalTime(utcDate);
  return `${date} ${time}`;
}
