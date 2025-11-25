<script setup lang="ts">
import { ref } from 'vue'

interface Schedule {
  time: string
  status: 'occupied' | 'free' | 'reserved'
  label: string
}

const selectedDate = ref('Today')
const startTime = ref('14:00')
const endTime = ref('15:30')

const schedule = ref<Schedule[]>([
  { time: '09:00', status: 'occupied', label: 'Occupied' },
  { time: '10:00', status: 'free', label: 'Free' },
  { time: '11:00', status: 'free', label: 'Free' },
  { time: '12:00', status: 'free', label: 'Free' },
  { time: '13:00', status: 'reserved', label: 'Reserved' },
  { time: '14:00', status: 'free', label: 'Free' },
  { time: '15:00', status: 'free', label: 'Free' },
  { time: '16:00', status: 'free', label: 'Free' },
])

const bookRoom = () => {
  alert(`Room booked from ${startTime.value} to ${endTime.value} on ${selectedDate.value}`)
}
</script>

<template>
  <div class="container">
    <div class="header">
      <span class="back-arrow">←</span>
      <span class="header-title">Room A.2.10</span>
    </div>
    
    <div class="main-content">
      <div class="left-section">
        <div class="room-image">
          📸
        </div>
        
        <div class="status">
          <span class="status-dot"></span>
          <span class="status-text">Available Now</span>
        </div>
        
        <div class="location">📍 Building A, Floor 2</div>
        
        <div class="divider"></div>
        
        <div class="section-title">Room Information</div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-icon">👥</span>
            <span>6 people</span>
          </div>
          <div class="info-item">
            <span class="info-icon">📐</span>
            <span>20m²</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="section-title">Equipment</div>
        
        <div class="equipment-list">
          <div class="equipment-item">
            <span>✓</span>
            <span>Beamer</span>
          </div>
          <div class="equipment-item">
            <span>✓</span>
            <span>Whiteboard</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="section-title">Today's Schedule</div>
        
        <div class="schedule-section">
          <div v-for="item in schedule" :key="item.time" class="schedule-item">
            <span class="time">{{ item.time }}</span>
            <div :class="['timeline-bar', item.status]">{{ item.label }}</div>
          </div>
        </div>
      </div>
      
      <div class="right-section">
        <div class="booking-panel">
          <div class="booking-title">Book this room</div>
          
          <div class="form-group">
            <label class="form-label">Date</label>
            <select v-model="selectedDate" class="form-select">
              <option>Today</option>
              <option>Tomorrow</option>
              <option>Monday, 25.11.2025</option>
              <option>Tuesday, 26.11.2025</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Start</label>
            <select v-model="startTime" class="form-select">
              <option>14:00</option>
              <option>14:30</option>
              <option>15:00</option>
              <option>15:30</option>
              <option>16:00</option>
              <option>16:30</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">End</label>
            <select v-model="endTime" class="form-select">
              <option>15:30</option>
              <option>16:00</option>
              <option>16:30</option>
              <option>17:00</option>
              <option>17:30</option>
            </select>
          </div>
          
          <div class="duration">
            Duration: 1h 30min
          </div>
          
          <button @click="bookRoom" class="book-button">Book Room</button>
          
          <div class="booking-info">
            ⚠️ Remember to check in within 5 minutes of your booking start time, or the booking will be automatically cancelled.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header {
  background: #7b68ee;
  color: white;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-arrow {
  font-size: 20px;
  cursor: pointer;
}

.header-title {
  font-size: 18px;
  font-weight: normal;
}

.main-content {
  display: flex;
  min-height: 700px;
}

.left-section {
  flex: 1;
  padding: 30px;
  border-right: 1px solid #e0e0e0;
}

.right-section {
  width: 400px;
  padding: 30px;
  background: #fafafa;
}

.room-image {
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 64px;
}

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.status-dot {
  width: 14px;
  height: 14px;
  background: #4caf50;
  border-radius: 50%;
}

.status-text {
  font-size: 18px;
  font-weight: bold;
  color: #4caf50;
}

.location {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.divider {
  height: 1px;
  background: #e0e0e0;
  margin: 25px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: #333;
}

.info-icon {
  font-size: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.equipment-list {
  margin-bottom: 25px;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 15px;
  color: #333;
}

.schedule-section {
  margin-bottom: 30px;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.time {
  width: 60px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.timeline-bar {
  flex: 1;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
}

.occupied {
  background: #333;
  color: white;
}

.free {
  background: #e8f5e9;
  color: #4caf50;
}

.reserved {
  background: #fff3e0;
  color: #ff9800;
}

.booking-panel {
  position: sticky;
  top: 20px;
}

.booking-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #7b68ee;
}

.duration {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.book-button {
  width: 100%;
  padding: 16px;
  background: #7b68ee;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}

.book-button:hover {
  background: #6a5acd;
}

.booking-info {
  margin-top: 20px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 4px;
  font-size: 13px;
  color: #856404;
  line-height: 1.5;
}
</style>
