<template>
  <div class="admin-view">
    <h1>Admin Dashboard</h1>

    <div class="admin-container">
      <section class="admin-section">
        <h2>System Overview</h2>
        <div class="info-grid">
          <div class="info-card">
            <h3>Total Rooms</h3>
            <p class="info-value">0</p>
          </div>
          <div class="info-card">
            <h3>Active Bookings</h3>
            <p class="info-value">0</p>
          </div>
          <div class="info-card">
            <h3>Total Users</h3>
            <p class="info-value">0</p>
          </div>
          <div class="info-card">
            <h3>Buildings</h3>
            <p class="info-value">0</p>
          </div>
        </div>
      </section>

      <section class="admin-section">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-btn">
            <span class="icon">🏢</span>
            <span>Manage Rooms</span>
          </button>
          <button class="action-btn">
            <span class="icon">👥</span>
            <span>Manage Users</span>
          </button>
          <button class="action-btn">
            <span class="icon">📊</span>
            <span>View Reports</span>
          </button>
          <button class="action-btn">
            <span class="icon">⚙️</span>
            <span>System Settings</span>
          </button>
        </div>
      </section>

      <section class="admin-section">
        <h2>Recent Activity</h2>
        <p class="placeholder">Activity log coming soon...</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (!authStore.isAdmin) {
    router.push('/');
  }
});
</script>

<style scoped>
.admin-view {git merge
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.admin-view h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.admin-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.admin-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-card {
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.info-card h3 {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.info-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1976d2;
  margin: 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e3f2fd;
  border-color: #1976d2;
}

.action-btn .icon {
  font-size: 2rem;
}

.placeholder {
  padding: 3rem;
  text-align: center;
  color: #999;
  background: #f5f5f5;
  border-radius: 8px;
}
</style>
