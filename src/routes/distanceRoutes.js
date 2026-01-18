import express from 'express';

const router = express.Router();

/**
 * POST /api/distance/calculate
 * Calculate walking distance and time between two coordinates using Google Maps Distance Matrix API
 */
router.post('/calculate', async (req, res) => {
  try {
    const { origin, destination } = req.body;

    // Validate input
    if (!origin?.latitude || !origin?.longitude ||
        !destination?.latitude || !destination?.longitude) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Get API key from environment
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    // Call Google Maps Distance Matrix API (server-side - no CORS issues!)
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=walking&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(500).json({ error: `Google Maps API error: ${data.status}` });
    }

    const element = data.rows[0]?.elements[0];

    if (!element || element.status !== 'OK') {
      return res.status(404).json({ error: 'No route found' });
    }

    // Return formatted result
    res.json({
      distanceMeters: element.distance.value,
      durationMinutes: Math.ceil(element.duration.value / 60),
      distanceText: element.distance.text,
      durationText: element.duration.text
    });

  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;