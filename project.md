# Integrative Project 2025 – Meeting Room Booking System

## 1. Purpose
Develop a booking system for meeting rooms at MCI that supports flexible reservations, automatic room control, visual room status, statistics, and accessibility compliance.

## 2. Scope
The system manages:
- Room bookings
- Room status (free, reserved, occupied)
- Automatic control of doors, lights, and ventilation
- Visual status indicators
- Usage statistics
- Accessibility features
- Multi-platform access

## 3. Actors
- **User**
  - Students
  - Lecturers
  - Staff
- **Administrator**
  - System configuration and management
- **System**
  - Booking platform
- **Room Equipment**
  - Doors
  - Lights
  - Ventilation
  - Display elements (LEDs, screens)

## 4. Functional Requirements

### 4.1 Room Overview
The system must show:
- Available rooms
- Room size
- Equipment
- Availability status
- Estimated time to reach the room

### 4.2 Booking
User can:
- Select a room
- Select time and duration
- Confirm booking

System must:
- Verify availability
- Accept or reject booking
- Suggest alternatives if unavailable
- Mark room as reserved
- Display reservation status at the room

### 4.3 Room Entry Detection
User must enter room within 5 minutes using:
- QR code
- NFC
- Motion sensors

If user enters:
- Unlock door
- Turn on lights and ventilation
- Set status to occupied

### 4.4 Automatic Release
If user does not enter within 5 minutes:
- Cancel booking
- Mark room as free
- Reset room systems

### 4.5 Room End Handling
After booking time:
- Mark room as free
- Turn off lights and ventilation
- Lock door if required

### 4.6 Visual Status Display
At the room:
- Green = free
- Yellow = reserved
- Red = occupied

### 4.7 Statistics
System must provide:
- Usage frequency
- Occupancy times
- Popular rooms
- Utilization reports for administrators

### 4.8 Reachability
System displays travel time to room based on:
- User position
- Building layout

## 5. Non-Functional Requirements

### 5.1 Platform Independence
System must run on:
- Mobile devices
- Desktop PCs
- Laptops

### 5.2 Accessibility (WCAG)
System must include:
- Screen reader support
- High contrast options
- Scalable fonts
- Full keyboard operation
- Alternative input methods

### 5.3 Usability
- Intuitive interface
- Clear navigation

### 5.4 Reliability
- Real-time room status updates
- Stable operation

### 5.5 Data Protection
- Secure data storage
- Compliance with applicable regulations

## 6. Open Questions
- How is presence detection implemented?
- Which detailed statistics are required?
- Which equipment types must be supported?
- How is visual status displayed technically?
- How is reachability calculated or detected?
