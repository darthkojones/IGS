/**
 * Distance Calculation Service
 * Provides methods to calculate travel distance and time between locations
 */

import { GOOGLE_MAPS_CONFIG, isGoogleMapsConfigured } from '@/config/maps.config';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  distanceMeters: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Calculate distance and travel time using Google Maps Distance Matrix API
 * Calls our backend API endpoint to avoid CORS issues
 */
async function calculateDistanceWithGoogle(
  origin: Coordinates,
  destination: Coordinates
): Promise<DistanceResult> {
  // Call our backend API instead of Google directly (avoids CORS issues)
  const response = await fetch('/api/distance/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: { latitude: origin.latitude, longitude: origin.longitude },
      destination: { latitude: destination.latitude, longitude: destination.longitude }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Distance calculation failed');
  }

  const data = await response.json();

  return {
    distanceMeters: data.distanceMeters,
    durationMinutes: data.durationMinutes,
    distanceText: data.distanceText,
    durationText: data.durationText,
  };
}

/**
 * Calculate distance using simple Haversine formula (fallback method)
 * Estimates walking time based on average walking speed
 * Applies a 1.3x multiplier to account for roads/paths (not straight line)
 */
function calculateDistanceFallback(
  origin: Coordinates,
  destination: Coordinates
): DistanceResult {
  const straightLineDistance = calculateHaversineDistance(origin, destination);

  // Apply 1.3x multiplier to account for actual walking paths (not straight line)
  // Real walking routes are typically 20-40% longer than straight-line distance
  const distanceMeters = straightLineDistance * 1.3;

  const durationMinutes = Math.ceil(
    distanceMeters / GOOGLE_MAPS_CONFIG.fallbackWalkingSpeed
  );

  // Format distance text
  let distanceText: string;
  if (distanceMeters < 1000) {
    distanceText = `${Math.round(distanceMeters)} m`;
  } else {
    distanceText = `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  // Format duration text
  const durationText =
    durationMinutes === 1 ? '1 min' : `${durationMinutes} min`;

  return {
    distanceMeters,
    durationMinutes,
    distanceText,
    durationText,
  };
}

/**
 * Calculate distance and travel time between two locations
 * Uses Google Maps API if configured, otherwise falls back to Haversine formula
 */
export async function calculateDistance(
  origin: Coordinates,
  destination: Coordinates
): Promise<DistanceResult> {
  try {
    if (isGoogleMapsConfigured()) {
      return await calculateDistanceWithGoogle(origin, destination);
    } else {
      console.warn(
        'Google Maps API not configured. Using fallback distance calculation.'
      );
      return calculateDistanceFallback(origin, destination);
    }
  } catch (error) {
    console.warn('Google Maps API failed, using fallback:', error);
    return calculateDistanceFallback(origin, destination);
  }
}

/**
 * Get user's current location using browser Geolocation API
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Geocode an address to coordinates using Google Maps Geocoding API
 */
export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  if (!isGoogleMapsConfigured()) {
    console.warn('Google Maps API not configured. Cannot geocode address.');
    return null;
  }

  const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.append('address', address);
  url.searchParams.append('key', apiKey);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error(`Geocoding failed: ${data.status}`);
      return null;
    }

    const location = data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export const distanceService = {
  calculateDistance,
  getCurrentLocation,
  geocodeAddress,
};
