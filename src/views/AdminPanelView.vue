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
          <div class="metric-value">{{ statisticsStore.adminStatistics?.totalBookings || 0 }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Occupancy Rate</div>
          <div class="metric-value">{{ statisticsStore.adminStatistics?.occupancyRate || 0 }}%</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">No-Show Rate</div>
          <div class="metric-value">{{ statisticsStore.adminStatistics?.noShowRate || 0 }}%</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Cancellations</div>
          <div class="metric-value">{{ statisticsStore.adminStatistics?.cancellationRate || 0 }}%</div>
        </div>
      </div>

      <!-- Peak Hours Chart Section -->
      <div class="section">
        <h2>Peak Booking Hours</h2>
        <div v-if="statisticsStore.adminStatistics?.peakHours.length && statisticsStore.adminStatistics.peakHours.length > 0" class="chart-wrapper">
          <BarChart
            :data="peakHoursChartData"
            :options="peakHoursOptions"
          />
        </div>
        <p v-else class="no-data">No peak hour data available</p>
      </div>

      <!-- Popular Rooms Chart Section -->
      <div class="section">
        <h2>Most Popular Rooms</h2>
        <div v-if="statisticsStore.adminStatistics?.popularRooms.length && statisticsStore.adminStatistics.popularRooms.length > 0" class="chart-wrapper">
          <BarChart
            :data="popularRoomsChartData"
            :options="popularRoomsOptions"
          />
        </div>
        <p v-else class="no-data">No room usage data available</p>
      </div>

      <!-- Bookings Per Day Chart Section -->
      <div class="section">
        <h2>Bookings Per Day (Last 30 Days)</h2>
        <div v-if="statisticsStore.adminStatistics?.bookingsPerDay.size && statisticsStore.adminStatistics.bookingsPerDay.size > 0" class="chart-wrapper">
          <LineChart
            :data="bookingsPerDayChartData"
            :options="bookingsPerDayOptions"
          />
        </div>
        <p v-else class="no-data">No daily booking data available</p>
      </div>

      <!-- Bookings Per Day of Week Chart Section -->
      <div class="section">
        <h2>Bookings by Day of Week</h2>
        <div v-if="statisticsStore.adminStatistics?.bookingsPerDayOfWeek && statisticsStore.adminStatistics.bookingsPerDayOfWeek.length > 0" class="chart-wrapper">
          <LineChart
            :data="bookingsPerDayOfWeekChartData"
            :options="bookingsPerDayOfWeekOptions"
          />
        </div>
        <p v-else class="no-data">No day of week booking data available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatisticsStore } from '@/stores/statistics';
import { useThemeStore } from '@/stores/theme';
import { chartColors } from '@/assets/chartColors';
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { Bar as BarChart, Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const statisticsStore = useStatisticsStore();
const themeStore = useThemeStore();

// Get theme-aware text color
const textColor = computed(() => themeStore.isDarkMode ? '#e2e8f0' : '#333');
const gridColor = computed(() => themeStore.isDarkMode ? '#374151' : '#e5e7eb');

/**
 * Track window width for responsive labels
 */
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 0);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

/**
 * Subscribe to real-time updates on mount
 */
onMounted(async () => {
  await statisticsStore.fetchAdminStatistics();
  await statisticsStore.subscribeToRealtimeAdminStatistics();
  window.addEventListener('resize', handleResize);
});

/**
 * Cleanup subscription on unmount
 */
onUnmounted(async () => {
  await statisticsStore.unsubscribeFromRealtimeAdminStatistics();
  window.removeEventListener('resize', handleResize);
});

/**
 * Get recent bookings per day (last 30 days)
 */
function getRecentBookingsPerDay() {
  if (!statisticsStore.adminStatistics?.bookingsPerDay) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return Array.from(statisticsStore.adminStatistics.bookingsPerDay.entries())
    .map(([date, count]) => ({ date, count }))
    .filter((item) => new Date(item.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get peak hours sorted chronologically (0:00 to 23:00)
 */
function getSortedPeakHours() {
  if (!statisticsStore.adminStatistics?.peakHours.length) return [];

  return statisticsStore.adminStatistics.peakHours
    .slice(0, 24)
    .sort((a, b) => a.hour - b.hour);
}

/**
 * Format hour (0-23) to readable time
 */
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * Peak Hours Chart Data (computed - Chart.js watches this)
 */
const peakHoursChartData = computed(() => {
  const sortedPeakHours = getSortedPeakHours();
  return {
    labels: sortedPeakHours.map((h) => formatHour(h.hour)),
    datasets: [
      {
        label: 'Bookings',
        data: sortedPeakHours.map((h) => h.count),
        backgroundColor: chartColors.peakHours.background,
        borderColor: chartColors.peakHours.border,
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: chartColors.peakHours.hover
      }
    ]
  };
});

/**
 * Popular Rooms Chart Data (computed - Chart.js watches this)
 */
const popularRoomsChartData = computed(() => {
  const rooms = statisticsStore.adminStatistics?.popularRooms.slice(0, 10) || [];
  return {
    labels: rooms.map((r) => r.roomId),
    datasets: [
      {
        label: 'Bookings',
        data: rooms.map((r) => r.usageFrequency),
        backgroundColor: chartColors.popularRooms.background,
        borderColor: chartColors.popularRooms.border,
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: chartColors.popularRooms.hover,
        // Store room names for tooltip display
        roomNames: rooms.map((r) => r.roomName)
      }
    ]
  };
});

/**
 * Bookings Per Day Chart Data (computed - Chart.js watches this)
 */
const bookingsPerDayChartData = computed(() => {
  const recentBookingsPerDay = getRecentBookingsPerDay();
  return {
    labels: recentBookingsPerDay.map((d) => {
      const [, month, day] = d.date.split('-');
      return `${month}/${day}`;
    }),
    datasets: [
      {
        label: 'Daily Bookings',
        data: recentBookingsPerDay.map((d) => d.count),
        borderColor: chartColors.bookingsPerDay.border,
        backgroundColor: chartColors.bookingsPerDay.background,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: chartColors.bookingsPerDay.point,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        hoverBackgroundColor: chartColors.bookingsPerDay.hover
      }
    ]
  };
});

/**
 * Peak Hours Chart Options
 */
const peakHoursOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: textColor.value
      },
      onClick: () => {} // Disable toggling dataset visibility on legend click
    },
    title: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        font: { size: 12 },
        color: textColor.value
      },
      grid: {
        color: gridColor.value
      }
    },
    x: {
      ticks: {
        font: { size: 11 },
        color: textColor.value
      },
      grid: {
        color: gridColor.value
      }
    }
  }
}));

/**
 * Popular Rooms Chart Options
 */
const popularRoomsOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: textColor.value
      },
      onClick: () => {} // Disable toggling dataset visibility on legend click
    },
    title: {
      display: false
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const roomId = context[0].label;
          const roomName = context[0].dataset.roomNames?.[context[0].dataIndex];
          return `${roomId}: ${roomName}`;
        },
        label: (context: any) => {
          return `Bookings: ${context.parsed.y}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        font: { size: 12 },
        color: textColor.value
      },
      grid: {
        color: gridColor.value
      }
    },
    x: {
      ticks: {
        font: { size: 11 },
        color: textColor.value
      },
      grid: {
        color: gridColor.value
      }
    }
  }
}));

/**
 * Bookings Per Day Chart Options
 */
const bookingsPerDayOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: textColor.value
      },
      onClick: () => {} // Disable toggling dataset visibility on legend click
    },
    title: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        font: { size: 12 },
        color: textColor.value
      },
      grid: {
        color: gridColor.value
      }
    },
    x: {
      ticks: {
        font: { size: 11 },
        color: textColor.value
      },
      grid: {
        color: gridColor.value
      }
    }
  }
}));

/**
 * Bookings Per Day of Week Chart Data (computed)
 */
const bookingsPerDayOfWeekChartData = computed(() => {
  const weekData = statisticsStore.adminStatistics?.bookingsPerDayOfWeek || [];
  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isSmallScreen = windowWidth.value < 768;

  return {
    labels: weekData.map((d, index) => isSmallScreen ? dayAbbreviations[index] : d.day),
    datasets: [
      {
        label: 'Bookings',
        data: weekData.map((d) => d.count),
        borderColor: chartColors.bookingsPerDayOfWeek.border,
        backgroundColor: chartColors.bookingsPerDayOfWeek.background,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: chartColors.bookingsPerDayOfWeek.point,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        hoverBackgroundColor: chartColors.bookingsPerDayOfWeek.hover
      }
    ]
  };
});

/**
 * Bookings Per Day of Week Chart Options
 */
const bookingsPerDayOfWeekOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: textColor.value
      },
      onClick: () => {} // Disable toggling dataset visibility on legend click
    },
    title: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        font: { size: 12 },
        color: textColor.value
      },
      grid: {
        color: gridColor.value
      }
    },
    x: {
      ticks: {
        font: { size: 11 },
        color: textColor.value
      },
      grid: {
        color: gridColor.value
      }
    }
  }
}));
</script>

<style scoped>
.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: var(--color-heading);
}

.subtitle {
  color: var(--color-text-soft);
  font-size: 1rem;
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
  background: v-bind('chartColors.cards.gradient');
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
  background: var(--color-card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-card);
}

.section h2 {
  margin: 0 0 1.5rem 0;
  color: var(--color-heading);
  font-size: 1.5rem;
}

.no-data {
  text-align: center;
  color: var(--color-text-soft);
  padding: 2rem;
  font-style: italic;
}

/* Chart Wrapper */
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  min-height: 300px;
}

@media (max-width: 768px) {
  .admin-panel {
    padding: 0.75rem;
  }

  .header h1 {
    font-size: 1.5rem;
  }

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

  .section {
    padding: 1rem;
  }

  .chart-wrapper {
    height: 300px;
  }
}
</style>
