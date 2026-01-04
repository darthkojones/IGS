/**
 * Smart time formatting utility
 * Formats duration in milliseconds to human-readable format
 * Examples: "5 min", "45 min", "2 hours", "2h 30min"
 */

export function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.floor(milliseconds / 60000);

  if (totalMinutes < 1) {
    return 'less than 1 min';
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  // Format as "2h 30min"
  return `${hours}h ${minutes}min`;
}

/**
 * Calculate time remaining between now and a target date
 * Returns milliseconds
 */
export function getTimeRemaining(targetDate: Date): number {
  const now = new Date();
  return targetDate.getTime() - now.getTime();
}

/**
 * Calculate time elapsed since a start date
 * Returns milliseconds
 */
export function getTimeElapsed(startDate: Date): number {
  const now = new Date();
  return now.getTime() - startDate.getTime();
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < new Date().getTime();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > new Date().getTime();
}
