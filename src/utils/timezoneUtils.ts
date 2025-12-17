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
  const localDate = new Date(localDateTimeString);

  // Get the timezone offset in milliseconds
  const offsetMs = localDate.getTimezoneOffset() * 60000;

  // Convert to UTC by adding the offset
  const utcDate = new Date(localDate.getTime() + offsetMs);

  return utcDate;
}

/**
 * Convert UTC time to local time for display
 * @param utcDate - Date object in UTC
 * @returns Object with date and time strings in local timezone
 */
export function utcToLocalTime(utcDate: Date): { date: string; time: string } {
  // Adjust for timezone offset
  const offsetMs = utcDate.getTimezoneOffset() * 60000;
  const localDate = new Date(utcDate.getTime() - offsetMs);

  // Extract date and time from ISO string
  const isoString = localDate.toISOString();
  const parts = isoString.split('T');
  const date: string = parts[0] || '2025-01-01';
  const time: string = (parts[1] || '00:00:00').slice(0, 5);

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
  const offsetMs = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offsetMs);

  return localDate.toLocaleTimeString('en-US', {
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
  const offsetMs = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offsetMs);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return localDate.toLocaleDateString('en-US', options || defaultOptions);
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
