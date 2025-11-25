# Meeting Room Booking System - Project Structure

## Overview
This is a Vue 3 + TypeScript application for managing meeting room bookings at MCI, featuring real-time status updates, automatic room control, accessibility compliance (WCAG), and comprehensive statistics.

## Project Structure

```
IGS/
├── src/
│   ├── assets/              # Static assets (CSS, images)
│   ├── components/          # Reusable Vue components
│   │   ├── BookingForm.vue
│   │   ├── RoomCard.vue
│   │   ├── RoomStatusDisplay.vue
│   │   └── ...
│   ├── composables/         # Reusable composition functions
│   │   ├── useAccessibility.ts    # WCAG compliance features
│   │   ├── useBookingTimer.ts     # 5-minute entry timer
│   │   ├── useReachability.ts     # Calculate travel time to rooms
│   │   └── useRoomStatus.ts       # Room status management
│   ├── router/              # Vue Router configuration
│   │   └── index.ts
│   ├── services/            # API service layer
│   │   ├── authService.ts
│   │   ├── bookingService.ts
│   │   ├── roomService.ts
│   │   └── statisticsService.ts
│   ├── stores/              # Pinia state management
│   │   ├── auth.ts          # Authentication state
│   │   ├── bookings.ts      # Bookings management
│   │   ├── rooms.ts         # Rooms & buildings
│   │   └── statistics.ts    # Usage statistics
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # All interfaces & enums
│   ├── views/               # Page components
│   │   ├── HomeView.vue
│   │   ├── RoomsView.vue
│   │   ├── RoomDetailView.vue
│   │   ├── BookingsView.vue
│   │   ├── NewBookingView.vue
│   │   ├── BookingDetailView.vue
│   │   ├── StatisticsView.vue
│   │   ├── AdminView.vue
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── ProfileView.vue
│   │   └── AccessibilityView.vue
│   ├── App.vue
│   ├── main.ts
│   └── env.d.ts
├── public/
│   ├── 404.html             # SPA routing fix for GitHub Pages
│   └── favicon.ico
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions deployment
├── index.html               # SPA entry with redirect script
├── vite.config.ts           # Vite configuration (with base: '/IGS/')
├── package.json
└── project.md               # Project requirements

```

## Key Features Implemented

### 1. Type System (`src/types/index.ts`)
Based on the ER diagrams provided:
- **Institution** - Multi-campus support
- **Building** - Buildings with floor and room counts
- **Room** - Rooms with equipment, capacity, and status
- **Equipment** - Room equipment (projectors, whiteboards, etc.)
- **User** - Students, teachers, staff, and admin roles
- **Booking** - Reservations with status tracking
- **Statistics** - Usage analytics

### 2. State Management (Pinia Stores)
- **auth** - User authentication and authorization
- **rooms** - Room and building data management
- **bookings** - Booking lifecycle management
- **statistics** - Usage reports and analytics

### 3. Composables (Reusable Logic)
- **useRoomStatus** - Visual status (green/yellow/red)
- **useBookingTimer** - 5-minute entry countdown
- **useAccessibility** - WCAG compliance (high contrast, font scaling, screen reader)
- **useReachability** - Calculate travel time to rooms

### 4. Components
- **RoomCard** - Display room info with status indicator
- **BookingForm** - Create new bookings
- **RoomStatusDisplay** - Large status display for room entrances

### 5. Views
- **RoomsView** - Browse available rooms
- **RoomDetailView** - Detailed room information
- **BookingsView** - User's booking history
- **NewBookingView** - Create new booking
- **BookingDetailView** - Booking details with QR/NFC entry
- **StatisticsView** - Usage analytics
- **AdminView** - System administration
- **AccessibilityView** - Accessibility settings

### 6. Routing
Routes configured with:
- Authentication guards (`requiresAuth`)
- Admin-only routes (`requiresAdmin`)
- Lazy-loaded components for performance

## Functional Requirements Coverage

### ✅ Implemented Structure
1. **Room Overview** - RoomsView with filtering
2. **Booking System** - Complete booking flow
3. **Entry Detection** - Timer composable for 5-min window
4. **Automatic Release** - Handled by booking timer
5. **Room Control** - API service layer ready
6. **Visual Status** - Color-coded displays (green/yellow/red)
7. **Statistics** - Store and service layer
8. **Reachability** - Geolocation-based distance calculation
9. **Accessibility** - WCAG-compliant composable

### 🔨 To Be Implemented (Backend Required)
- API integration (all services have TODO markers)
- WebSocket for real-time updates
- QR code/NFC entry verification
- IoT integration (doors, lights, ventilation)
- Actual room control logic
- Database persistence

## Non-Functional Requirements

### ✅ Platform Independence
- Responsive Vue 3 application
- Works on mobile, desktop, tablets

### ✅ Accessibility (WCAG)
- `useAccessibility` composable provides:
  - High contrast mode
  - Scalable fonts (normal/large/extra-large)
  - Screen reader support
  - Keyboard navigation
  - Reduced motion option
- ARIA labels throughout components

### ✅ Usability
- Intuitive component-based UI
- Clear navigation via Vue Router

### 🔨 To Implement
- Real-time updates (WebSocket)
- Backend API
- Authentication system
- Data protection/encryption

## Data Model

Based on ER diagrams:

```typescript
Institution (1) -> (*) Building
Building (1) -> (*) Room
Room (1) -> (*) Equipment
Room (1) -> (*) Booking
User (1) -> (*) Booking
Institution (1) -> (*) User
```

### Key Enums
- **RoomStatus**: FREE, RESERVED, OCCUPIED
- **BookingStatus**: RESERVED, ACTIVE, COMPLETED, CANCELLED, NO_SHOW
- **UserRole**: STUDENT, TEACHER, STAFF, ADMIN
- **EntryMethod**: QR_CODE, NFC, MOTION_SENSOR
- **EquipmentType**: PROJECTOR, WHITEBOARD, COMPUTER, etc.

## Next Steps

### Phase 1: Backend Development
1. Create REST API (Node.js/Express or similar)
2. Database setup (PostgreSQL/MongoDB)
3. Authentication system (JWT)
4. WebSocket for real-time updates

### Phase 2: Integration
1. Connect services to actual API endpoints
2. Implement QR code generation/scanning
3. NFC integration
4. Motion sensor integration

### Phase 3: IoT Integration
1. Room control system (doors, lights, ventilation)
2. Presence detection
3. LED/display status indicators

### Phase 4: Advanced Features
1. Building layout mapping
2. Indoor navigation
3. Calendar integration
4. Email notifications
5. Mobile app (React Native/Flutter)

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm run test:unit

# Deploy to GitHub Pages
git push origin main  # Automatic via GitHub Actions
```

## Environment Variables

Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## GitHub Pages Configuration

- **Base URL**: `/IGS/`
- **Deployment**: Automatic via GitHub Actions on push to `main`
- **URL**: https://darthkojones.github.io/IGS/

## Architecture Decisions

### Why Vue 3 + Composition API?
- Better TypeScript support
- Reusable logic via composables
- Better performance
- More maintainable

### Why Pinia?
- Official Vue state management
- TypeScript support
- Simpler than Vuex
- Better DevTools

### Why Composables Pattern?
- Separation of concerns
- Reusable business logic
- Easy testing
- Clear dependencies

## Accessibility Features

The `useAccessibility` composable provides:

```typescript
// Toggle features
toggleHighContrast()
setFontSize('large')
toggleScreenReaderMode()
toggleReducedMotion()

// Announce for screen readers
announce('Booking confirmed', 'polite')
```

CSS classes applied:
- `.high-contrast` - High contrast colors
- `.font-large` - Large text
- `.reduced-motion` - Disable animations

## Contributing

1. Create feature branch
2. Make changes
3. Run linting and tests
4. Submit PR

## License

[Add appropriate license]
