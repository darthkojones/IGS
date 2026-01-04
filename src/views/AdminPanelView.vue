<template>
  <div class="admin-panel">
    <div class="header">
      <h1>Admin Dashboard</h1>
      <p class="subtitle">Real-time booking statistics and analytics</p>
    </div>

    <!-- Loading State -->
    <div v-if="statisticsStore.loading" class="loading">
      <p>Loading statistics...</p>
    </div>

    <!-- Error State -->
    <div v-if="statisticsStore.error" class="error">
      <p>Error: {{ statisticsStore.error }}</p>
    </div>

    <!-- Statistics Display -->
    <div v-if="statisticsStore.adminStatistics && !statisticsStore.loading" class="statistics-container">
      <!-- Key Metrics Row -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Bookings</div>
          <div class="metric-value">{{ statisticsStore.adminStatistics.totalBookings }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Occupancy Rate</div>
          <div class="metric-value">{{ statisticsStore.adminStatistics.occupancyRate }}%</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">No-Show Rate</div>
          <div class="metric-value">{{ statisticsStore.adminStatistics.noShowRate }}%</div>
        </div>
      </div>

      <!-- Peak Hours Section -->
      <div class="section">
        <h2>Peak Booking Hours</h2>
        <div class="peak-hours-list">
          <div
            v-if="statisticsStore.adminStatistics.peakHours.length > 0"
            class="hours-container"
          >
            <div
              v-for="(hour, index) in sortedPeakHours"
              :key="index"
              class="hour-item"
            >
              <div class="hour-bar">
                <span class="hour-count">{{ hour.count }}</span>
                <div
                  class="hour-fill"
                  :style="{
                    height: `${
                      (hour.count / maxPeakHourCount) * 100
                    }%`
                  }"
                ></div>
              </div>
              <span class="hour-label">{{ formatHour(hour.hour) }}</span>
            </div>
          </div>
          <p v-else class="no-data">No peak hour data available</p>
        </div>
      </div>

      <!-- Popular Rooms Section -->
      <div class="section">
        <h2>Most Popular Rooms</h2>
        <div v-if="statisticsStore.adminStatistics.popularRooms.length > 0" class="popular-rooms">
          <div
            v-for="(room, index) in statisticsStore.adminStatistics.popularRooms.slice(0, 10)"
            :key="index"
            class="room-item"
          >
            <span class="room-count">{{ room.usageFrequency }} bookings</span>
            <div class="room-bar" :title="room.roomName">
              <div
                class="room-fill"
                :style="{
                  height: `${(room.usageFrequency / maxRoomUsage) * 100}%`
                }"
              ></div>
            </div>
            <span class="room-label" :title="room.roomName">{{ room.roomId }}</span>
          </div>
        </div>
        <p v-else class="no-data">No room usage data available</p>
      </div>

      <!-- Bookings Per Day Section -->
      <div class="section">
        <h2>Bookings Per Day (Last 30 Days)</h2>
        <svg v-if="recentBookingsPerDay.length > 0" class="line-chart" viewBox="0 0 1000 300">
          <!-- Grid lines -->
          <line x1="50" y1="250" x2="950" y2="250" stroke="#e0e0e0" stroke-width="1" />

          <!-- Y-axis labels -->
          <text x="20" y="255" font-size="12" text-anchor="end">0</text>
          <text x="20" y="180" font-size="12" text-anchor="end">{{ maxDailyBookings / 2 }}</text>
          <text x="20" y="105" font-size="12" text-anchor="end">{{ maxDailyBookings }}</text>

          <!-- Line path -->
          <polyline
            :points="linePoints"
            fill="none"
            stroke="#4facfe"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Area under line -->
          <polygon
            :points="areaPoints"
            fill="url(#gradient)"
            opacity="0.3"
          />

          <!-- Gradient definition -->
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#4facfe;stop-opacity:0.5" />
              <stop offset="100%" style="stop-color:#4facfe;stop-opacity:0" />
            </linearGradient>
          </defs>

          <!-- Data points -->
          <circle
            v-for="(point, i) in chartPoints"
            :key="i"
            :cx="point.x"
            :cy="point.y"
            r="4"
            fill="#4facfe"
          />

          <!-- X-axis labels -->
          <text
            v-for="(point, i) in xAxisLabels"
            :key="`label-${i}`"
            :x="point.x"
            y="270"
            font-size="12"
            text-anchor="middle"
          >
            {{ point.label }}
          </text>
        </svg>
        <p v-else class="no-data">No daily booking data available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatisticsStore } from '@/stores/statistics';
import { onMounted, onUnmounted, computed } from 'vue';

const statisticsStore = useStatisticsStore();

/**
 * Subscribe to real-time updates on mount
 */
onMounted(async () => {
  await statisticsStore.fetchAdminStatistics();
  await statisticsStore.subscribeToRealtimeAdminStatistics();
});

/**
 * Cleanup subscription on unmount
 */
onUnmounted(async () => {
  await statisticsStore.unsubscribeFromRealtimeAdminStatistics();
});

/**
 * Compute the maximum peak hour count for scaling
 */
const maxPeakHourCount = computed(() => {
  if (!statisticsStore.adminStatistics?.peakHours.length) return 1;
  return Math.max(...statisticsStore.adminStatistics.peakHours.map((h) => h.count));
});

/**
 * Compute the maximum room usage for scaling
 */
const maxRoomUsage = computed(() => {
  if (!statisticsStore.adminStatistics?.popularRooms.length) return 1;
  return Math.max(...statisticsStore.adminStatistics.popularRooms.map((r) => r.usageFrequency));
});

/**
 * Get recent bookings per day (last 30 days)
 */
const recentBookingsPerDay = computed(() => {
  if (!statisticsStore.adminStatistics?.bookingsPerDay) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return Array.from(statisticsStore.adminStatistics.bookingsPerDay.entries())
    .map(([date, count]) => ({ date, count }))
    .filter((item) => new Date(item.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

/**
 * Calculate max daily bookings for SVG chart scaling
 */
const maxDailyBookings = computed(() => {
  if (!recentBookingsPerDay.value.length) return 1;
  return Math.max(...recentBookingsPerDay.value.map((d) => d.count));
});

/**
 * Calculate data points for SVG chart rendering
 */
const chartPoints = computed(() => {
  if (!recentBookingsPerDay.value.length) return [];

  const width = 900 / recentBookingsPerDay.value.length;
  const maxCount = maxDailyBookings.value;

  return recentBookingsPerDay.value.map((d, i) => ({
    x: 50 + i * width,
    y: 250 - (d.count / maxCount) * 200,
    label: d.date.substring(5), // MM-DD format
    count: d.count
  }));
});

/**
 * Generate SVG polyline points for line chart
 */
const linePoints = computed(() => {
  return chartPoints.value.map((p) => `${p.x},${p.y}`).join(' ');
});

/**
 * Generate SVG polygon points for area chart fill
 */
const areaPoints = computed(() => {
  if (!chartPoints.value.length) return '';

  const points = chartPoints.value.map((p) => `${p.x},${p.y}`);
  const lastPoint = chartPoints.value[chartPoints.value.length - 1];
  const closePath = lastPoint
    ? [
        `${lastPoint.x},250`,
        `50,250`
      ]
    : [];

  return [...points, ...closePath].join(' ');
});

/**
 * Get x-axis labels - every nth point to avoid crowding
 */
const xAxisLabels = computed(() => {
  if (!chartPoints.value.length) return [];
  const interval = Math.ceil(chartPoints.value.length / 6);
  return chartPoints.value.filter((_, i) => i % interval === 0);
});

/**
 * Get peak hours sorted chronologically (0:00 to 23:00)
 */
const sortedPeakHours = computed(() => {
  if (!statisticsStore.adminStatistics?.peakHours.length) return [];

  return statisticsStore.adminStatistics.peakHours
    .slice(0, 24)
    .sort((a, b) => a.hour - b.hour);
});
/**
 * Format hour (0-23) to readable time
 */
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}
</script>

<style scoped>
.admin-panel {
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
}

.loading {
  background-color: #e3f2fd;
  color: #1976d2;
}

.error {
  background-color: #ffebee;
  color: #c62828;
}

.statistics-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
}

.metric-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: bold;
}

/* Section Styles */
.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 2rem;
  font-style: italic;
}

/* SVG Line Chart */
.line-chart {
  width: 100%;
  height: auto;
  min-height: 300px;
  max-width: 100%;
}

/* Peak Hours */
.peak-hours-list {
  display: flex;
  flex-direction: column;
}

.hours-container {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: flex-end;
  width: 100%;
  padding-bottom: 0.5rem;
  min-height: 200px;
}

.hour-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.hour-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hour-bar {
  width: 100%;
  height: 150px;
  background-color: #e0e0e0;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
}

.hour-fill {
  width: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  transition: height 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hour-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  text-align: center;
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* Popular Rooms */
.popular-rooms {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: flex-end;
  padding-bottom: 0.5rem;
}

.room-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.room-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.room-bar {
  width: 100%;
  height: 150px;
  background-color: #e0e0e0;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.room-fill {
  width: 100%;
  background: linear-gradient(180deg, #f093fb 0%, #f5576c 100%);
  transition: height 0.3s ease;
}

.room-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  text-align: center;
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* Chart Container */
.chart-container {
  width: 100%;
  height: 400px;
  margin-top: 1rem;
}

/* Daily Stats */
.daily-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
}

.day-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.day-label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.day-bar {
  height: 100px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.day-fill {
  width: 100%;
  background: linear-gradient(180deg, #4facfe 0%, #00f2fe 100%);
  transition: height 0.3s ease;
}

.day-count {
  text-align: center;
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

/* Responsive - Tablet */
@media (max-width: 1024px) {
  .admin-panel {
    padding: 1.5rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }

  .daily-stats {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

/* Responsive - Small Tablet */
@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }

  .metric-card {
    padding: 1rem;
  }

  .metric-value {
    font-size: 1.8rem;
  }

  .metric-label {
    font-size: 0.8rem;
  }

  .hours-container {
    display: none;
  }
}

/* Responsive - Mobile */
@media (max-width: 768px) {
  .admin-panel {
    padding: 1rem;
  }

  .header h1 {
    font-size: 1.8rem;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .metric-card {
    padding: 1rem;
  }

  .metric-value {
    font-size: 2rem;
  }

  .section {
    padding: 1rem;
  }

  .section h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .hour-item,
  .room-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .hour-label,
  .room-label {
    width: 100%;
    min-width: auto;
  }

  .hour-bar,
  .room-bar {
    width: 100%;
    min-width: unset;
  }

  .hour-count,
  .room-count {
    width: 100%;
    text-align: left;
    min-width: auto;
  }

  .daily-stats {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
    max-height: none;
  }

  .day-bar {
    height: 80px;
  }
}
</style>
