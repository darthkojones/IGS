# Dark/Light Theme Implementation

## Overview
A comprehensive light/dark theme toggle has been implemented across your entire application. The theme affects all views, components, cards, inputs, and UI elements.

## Files Created

### 1. Theme Store (`src/stores/theme.ts`)
- Manages the theme state (light/dark)
- Persists theme preference to localStorage
- Initializes from saved preference or system preference
- Provides `toggleTheme()` and `setTheme()` methods

### 2. Theme Toggle Component (`src/components/ThemeToggle.vue`)
- Small circular toggle button with sun/moon icon
- Positioned in the header next to the burger menu
- Smooth hover and click animations
- Accessible with aria-labels

### 3. Theme CSS Files
- **`src/assets/base.css`** - Updated with comprehensive CSS variables for both themes
- **`src/assets/theme.css`** - Global theme styles for common UI patterns
- **`src/assets/global-overrides.css`** - Catch-all overrides for consistent theming

## CSS Variables Defined

### Light Theme
- Backgrounds: `--color-background`, `--color-card-bg`, `--color-surface`
- Text: `--color-text`, `--color-heading`, `--color-text-soft`
- Primary: `--color-primary`, `--color-primary-hover`
- Status: success, warning, error, info colors
- Borders, shadows, and more

### Dark Theme
- Dark backgrounds (#1a1a1a, #2a2a2a)
- Light text (#e5e5e5)
- Adjusted primary colors for dark mode
- Enhanced shadows for depth
- Proper contrast for readability

## Components Updated

✅ **App.vue** - Header, footer, main container
✅ **BurgerMenu.vue** - Menu panel and items
✅ **RoomCard.vue** - Card backgrounds and text
✅ **QuickAccessTile.vue** - Tile backgrounds and hover states
✅ **HomeView.vue** - Bookings, headers, cards
✅ **RoomsView.vue** - Filters, inputs, warnings

## Features

### 🎨 Automatic Theme Application
- Theme changes apply instantly across all views
- Smooth 0.3s transitions for color changes
- No page refresh required

### 💾 Persistence
- Theme preference saved to localStorage
- Automatically restored on page load
- Falls back to system preference if no saved theme

### ♿ Accessibility
- Proper ARIA labels on toggle button
- Keyboard accessible
- Maintains proper contrast ratios in both themes

### 📱 Responsive
- Toggle button scales appropriately on mobile
- Theme works on all screen sizes

## Usage

The theme toggle is automatically visible in the header. Users can:
1. Click the toggle button (🌙/☀️) to switch themes
2. Theme preference is automatically saved
3. Theme persists across page refreshes and sessions

## How It Works

1. **Initialization**: When the app loads, `themeStore.initTheme()` is called in App.vue
2. **Theme Application**: The store adds/removes `dark-theme` class to `document.documentElement`
3. **CSS Variables**: All components use CSS variables that automatically change based on the theme class
4. **Persistence**: Every theme change is saved to localStorage

## Customization

To adjust theme colors, edit the CSS variables in `src/assets/base.css`:

```css
:root.dark-theme {
  --color-background: #1a1a1a;  /* Change this for different dark background */
  --color-primary: #3b82f6;      /* Change primary color for dark mode */
  /* ... etc */
}
```

## Testing

Test the theme by:
1. Click the toggle button in the header
2. Navigate through different views (Home, Rooms, Bookings, etc.)
3. Check that all cards, inputs, and backgrounds change appropriately
4. Refresh the page - theme should persist
5. Check in both light and dark modes for readability

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties (CSS variables) support required
- localStorage support required for persistence
