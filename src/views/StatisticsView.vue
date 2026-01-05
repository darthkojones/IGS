<template>
  <div class="statistics-view">
    <h1>Usage Statistics</h1>

    <div class="stats-container">
      <section class="stats-overview">
        <h2>Overview</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Bookings</h3>
            <p class="stat-value">{{ overallStats?.totalBookings || 0 }}</p>
          </div>
          <div class="stat-card">
            <h3>Average Occupancy</h3>
            <p class="stat-value">{{ overallStats?.averageOccupancyTime || 0 }}h</p>
          </div>
          <div class="stat-card">
            <h3>No-Show Rate</h3>
            <p class="stat-value">{{ (overallStats?.noShowRate || 0).toFixed(1) }}%</p>
          </div>
          <div class="stat-card">
            <h3>Usage Frequency</h3>
            <p class="stat-value">{{ overallStats?.usageFrequency || 0 }}</p>
          </div>
        </div>
      </section>

      <section class="popular-rooms">
        <h2>Most Popular Rooms</h2>
        <div v-if="popularRooms.length === 0" class="no-data">
          No data available yet
        </div>
        <div v-else class="rooms-list">
          <div
            v-for="(room, index) in popularRooms"
            :key="room.roomId"
            class="room-stat"
          >
            <span class="rank">{{ index + 1 }}</span>
            <span class="room-name">Room {{ room.roomId }}</span>
            <span class="usage">{{ room.usageFrequency }} bookings</span>
          </div>
        </div>
      </section>

      <section class="peak-hours">
        <h2>Peak Booking Hours</h2>
        <div class="chart-placeholder">
          <p>Chart visualization coming soon</p>
          <p class="note">Will show booking frequency by hour of day</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStatisticsStore } from '@/stores/statistics';

const statisticsStore = useStatisticsStore();

const overallStats = computed(() => statisticsStore.overallStatistics);
const popularRooms = computed(() => statisticsStore.getMostPopularRooms);
//const loading = computed(() => statisticsStore.loading);

onMounted(() => {
  statisticsStore.fetchOverallStatistics();
});
</script>

<style scoped>
.statistics-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.statistics-view h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.stat-card h3 {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1976d2;
  margin: 0;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1976d2;
  color: white;
  border-radius: 50%;
  font-weight: 700;
}

.room-name {
  flex: 1;
  font-weight: 500;
}

.usage {
  color: #666;
}

.chart-placeholder {
  padding: 4rem 2rem;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
  color: #666;
}

.note {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #999;
}

.no-data {
  padding: 3rem;
  text-align: center;
  color: #999;
}
</style>
