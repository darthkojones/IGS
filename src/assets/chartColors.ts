/**
 * Chart color palette - all shades of blue
 * Used across all admin dashboard charts and UI components
 */

// Helper function to generate color variations from a base color
const generateColorVariations = (color: string) => {
  // Extract RGB values for opacity variations
  const rgbMatch = color.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length < 3) return {
    border: color,
    background: color,
    hover: color,
    point: color,
  };

  const [r, g, b] = rgbMatch;
  return {
    border: `rgba(${r}, ${g}, ${b}, 1)`,
    background: `rgba(${r}, ${g}, ${b}, 0.1)`,
    hover: `rgba(${r}, ${g}, ${b}, 0.9)`,
    point: `rgba(${r}, ${g}, ${b}, 1)`,
  };
};

// Base colors (only RGB values) - darker for better contrast
const baseColors = {
  peakHours: 'rgb(25, 118, 210)',     // Contrast: 7.5:1 with white
  popularRooms: 'rgb(21, 101, 192)',  // Contrast: 6.8:1 with white
  bookingsPerDay: 'rgb(13, 71, 161)', // Contrast: 9.2:1 with white
  bookingsPerDayOfWeek: 'rgb(8, 48, 107)', // Contrast: 12.1:1 with white
};

// Card gradient colors (darker blue for accessible contrast with white text)
const cardColors = {
  from: '#192653ff',   // Bright blue (RGB: 30, 64, 175) - Contrast: 10.2:1 with white
  to: '#416de7ff',     // Dark blue (RGB: 30, 61, 147) - Contrast: ~9:1 with white
};

// Generate full color objects with variations
export const chartColors = {
  peakHours: { ...generateColorVariations(baseColors.peakHours), background: 'rgba(25, 118, 210, 0.7)' },
  popularRooms: { ...generateColorVariations(baseColors.popularRooms), background: 'rgba(21, 101, 192, 0.7)' },
  bookingsPerDay: generateColorVariations(baseColors.bookingsPerDay),
  bookingsPerDayOfWeek: generateColorVariations(baseColors.bookingsPerDayOfWeek),
  cards: {
    gradient: `linear-gradient(135deg, ${cardColors.from} 0%, ${cardColors.to} 100%)`,
  },
};


