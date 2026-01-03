/**
 * Google Maps API Configuration
 *
 * To use distance calculation features, you need to:
 * 1. Get a Google Maps API key from https://console.cloud.google.com/
 * 2. Enable the "Distance Matrix API" in your Google Cloud Console
 * 3. Add your API key below
 *
 * Security Note: For production, use environment variables instead of hardcoding the key
 */

export const GOOGLE_MAPS_CONFIG = {
  // TODO: Add your Google Maps API key here
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',

  // Default travel mode for distance calculation
  travelMode: 'walking' as 'walking' | 'driving' | 'bicycling' | 'transit',

  // Fallback walking speed (meters per minute) if API is unavailable
  // Average walking speed is about 80-85 meters per minute
  fallbackWalkingSpeed: 80,
};

/**
 * Check if Google Maps API is configured
 */
export function isGoogleMapsConfigured(): boolean {
  return Boolean(GOOGLE_MAPS_CONFIG.apiKey);
}
