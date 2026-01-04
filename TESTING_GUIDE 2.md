# Manual Testing Checklist

## Setup
1. Start the development server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Navigate to the Rooms page

## Creating Test Data

**To test the "Show Booked Rooms" feature, you need bookings:**

**Option 1: Create a booking through the UI**
1. Go to the Rooms page
2. Click "Book Now" on any room
3. Fill in the booking form:
   - Select a start time (e.g., 30 minutes from now)
   - Select an end time (e.g., 1 hour after start)
   - Add a purpose
4. Submit the booking
5. The room should now show as booked

**Option 2: Create multiple test bookings**
- Repeat the above steps for 2-3 different rooms
- Use different time ranges to test various scenarios
- Some bookings in the past, some current, some future

---

## Test 1: Search Functionality
- [ ] Type a room name in the search box
- [ ] Verify rooms filter in real-time as you type
- [ ] Clear the search box
- [ ] Verify all rooms appear again

---

## Test 2: Building Filter
- [ ] Click the "All Buildings" dropdown
- [ ] Select a specific building
- [ ] Verify only rooms from that building are shown
- [ ] Select "All Buildings" again
- [ ] Verify all rooms appear

---

## Test 3: Sort by Name
- [ ] Select "Name ↑ (A-Z)" from sort dropdown
- [ ] Verify rooms are sorted alphabetically A to Z
- [ ] Select "Name ↓ (Z-A)"
- [ ] Verify rooms are sorted alphabetically Z to A

---

## Test 4: Sort by Capacity
- [ ] Select "Capacity ↑ (Smallest)" from sort dropdown
- [ ] Verify smallest capacity rooms appear first
- [ ] Check the capacity numbers increase as you scroll
- [ ] Select "Capacity ↓ (Largest)"
- [ ] Verify largest capacity rooms appear first

---

## Test 5: Capacity Filter
- [ ] Select "4+ people" from capacity filter
- [ ] Verify all shown rooms have capacity ≥ 4
- [ ] Select "10+ people"
- [ ] Verify all shown rooms have capacity ≥ 10
- [ ] Select "30+ people"
- [ ] Check if any rooms match (there might be none)
- [ ] Select "Any Capacity"
- [ ] Verify all rooms appear again

---

## Test 6: Equipment Filters
- [ ] Check the "Projector" checkbox
- [ ] Verify only rooms with projectors are shown
- [ ] Check the "Whiteboard" checkbox (keep Projector checked)
- [ ] Verify only rooms with BOTH projector AND whiteboard are shown
- [ ] Check "Video Conference" as well
- [ ] Verify only rooms with ALL three are shown
- [ ] Uncheck all boxes
- [ ] Verify all rooms appear again

---

## Test 7: DateTime Availability
- [ ] Look at the "Available from:" datetime input
- [ ] Verify it defaults to the current date/time
- [ ] Try to select a past date/time (should not allow)
- [ ] Select a future date/time (e.g., tomorrow at 2 PM)
- [ ] Verify rooms with bookings at that time disappear
- [ ] Note which rooms are still visible

---

## Test 8: Show Booked Rooms Toggle

**First, create a test booking:**
- [ ] Go to the Rooms page
- [ ] Click "Book Now" on any room
- [ ] Fill in the booking form with:
  - Start time: Select a time in the near future (e.g., 30 minutes from now)
  - End time: Select 1-2 hours after start time
  - Purpose: "Test booking"
- [ ] Submit the booking
- [ ] Return to the Rooms page

**Now test the toggle:**
- [ ] Select a datetime that falls within your test booking's time range
- [ ] Uncheck "Show booked rooms" (if checked)
- [ ] Verify the room you just booked is NOT visible
- [ ] Note how many rooms are visible
- [ ] Check "Show booked rooms"
- [ ] Verify the booked room now appears
- [ ] Verify the room shows status as "Booked" or "Occupied"
- [ ] Verify the room shows booking time information

**If you don't have any bookings:**
- [ ] Skip this test for now, or create a booking first using the "Book Now" button
- [ ] Alternatively, ask someone to help you add test data to the database

---

## Test 9: Distance Features
- [ ] Click "Enable Distance" button
- [ ] Browser will ask for location permission - click "Allow"
- [ ] Wait a few seconds for calculation
- [ ] Verify button text changes to "Update Location"
- [ ] Verify room cards now show distance (e.g., "500m" or "1.2 km")
- [ ] Verify room cards show travel time (e.g., "5 min walk")

---

## Test 10: Distance Sorting
- [ ] Make sure you've enabled location (Test 9)
- [ ] Select "Distance ↑ (Nearest)" from sort dropdown
- [ ] Verify nearest rooms appear first
- [ ] Check distance values increase as you scroll down
- [ ] Select "Distance ↓ (Farthest)"
- [ ] Verify farthest rooms appear first
- [ ] Check distance values decrease as you scroll down

---

## Test 11: Location Permission Denied
- [ ] Refresh the page
- [ ] Click "Enable Distance" button
- [ ] When browser asks for permission, click "Block" or "Deny"
- [ ] Verify a warning message appears about location access
- [ ] Verify distance sorting options don't work (rooms won't have distances)

---

## Test 12: Reset Filters
- [ ] Apply several filters:
  - Type something in search
  - Select a building
  - Select a capacity filter
  - Check some equipment boxes
  - Change the datetime
- [ ] Click "Reset Filters" button
- [ ] Verify:
  - Search box is cleared
  - Building is "All Buildings"
  - Capacity is "Any Capacity"
  - Equipment boxes are unchecked
  - DateTime resets to current time
  - Sort is back to "Name ↑ (A-Z)"
  - All rooms are shown

---

## Test 13: Combined Filters
- [ ] Search for "Conference"
- [ ] Select a specific building
- [ ] Select "8+ people" capacity
- [ ] Check "Projector"
- [ ] Verify only rooms matching ALL criteria are shown
- [ ] If no rooms match, try loosening one filter

---

## Test 14: Mobile Responsive (Optional)
- [ ] Press F12 to open developer tools
- [ ] Click the device toolbar icon (mobile view)
- [ ] Select a phone size (e.g., iPhone 12)
- [ ] Verify:
  - Filters stack vertically
  - Room cards display properly
  - All buttons are clickable
  - Text is readable

---

## Test 15: Edge Cases
- [ ] Apply filters that result in zero rooms
- [ ] Verify you see an empty state (no rooms message or empty grid)
- [ ] Reset filters
- [ ] Try typing gibberish in search (e.g., "zzzzz")
- [ ] Verify no rooms appear or appropriate message

---

## Expected Results Summary

**When working correctly:**
- Filters update the room list immediately
- Multiple filters work together (AND logic for equipment)
- Distance shows actual walking distance and time
- Booked rooms are hidden by default
- Can't select past dates/times
- Reset button clears everything
- Page is responsive on different screen sizes

**Common Issues to Watch For:**
- Distance not showing? Check if you granted location permission
- No rooms showing? Check if your filters are too restrictive
- Sort not working? Make sure you have rooms loaded
- DateTime issues? Verify your system time is correct

---

## Quick Test (5 minutes)
If you're short on time, test these critical features:
1. [ ] Search works
2. [ ] Building filter works
3. [ ] Sort by capacity works
4. [ ] Equipment checkboxes work
5. [ ] Enable distance and verify it shows on cards
6. [ ] Reset filters works
