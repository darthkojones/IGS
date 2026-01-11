<template>
  <div class="profile-view">
    <h1>My Profile</h1>

    <div v-if="user" class="profile-container">
      <section class="profile-info">
        <h2>Personal Information</h2>
        <dl>
          <dt>First Name:</dt>
          <dd>{{ user.firstName }}</dd>
          <dt>Last Name:</dt>
          <dd>{{ user.lastName }}</dd>
          <dt>Role:</dt>
          <dd class="role-badge">{{ user.role }}</dd>
          <dt>Institution:</dt>
          <dd>{{ user.institution?.fullName + ' (' + user.institution?.name + ')' || 'Not specified' }}</dd>
        </dl>
      </section>

      <section class="profile-stats">
        <h2>Booking Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Bookings</h3>
            <p class="stat-value">{{ upcomingBookings.length + pastBookings.length }}</p>
          </div>
          <div class="stat-card">
            <h3>Upcoming</h3>
            <p class="stat-value">{{ upcomingBookings.length }}</p>
          </div>
          <div class="stat-card">
            <h3>Completed</h3>
            <p class="stat-value">{{ pastBookings.length }}</p>
          </div>
        </div>
      </section>

      <section class="profile-actions">
        <h2>Actions</h2>
        <div class="actions-list">
          <router-link to="/bookings" class="action-link">
            📅 View My Bookings
          </router-link>
          <router-link to="/accessibility" class="action-link">
            ♿ Accessibility Settings
          </router-link>
          <button @click="handleLogout" class="btn btn--secondary">
            🚪 Logout
          </button>
        </div>
      </section>
    </div>

    <div v-else class="no-user">
      <p>Please login to view your profile</p>
      <router-link to="/login" class="btn btn--primary">Login</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBookingsStore } from '@/stores/bookings';

const router = useRouter();
const authStore = useAuthStore();
const bookingsStore = useBookingsStore();

const user = computed(() => authStore.currentUser);
const upcomingBookings = computed(() => bookingsStore.upcomingBookings);
const pastBookings = computed(() => bookingsStore.pastBookings);

const handleLogout = async () => {
  await authStore.logout();
  router.push('/');
};
</script>

<style scoped>
.profile-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--color-background);
  min-height: 100vh;
}

.profile-view h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--color-heading);
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

section {
  background: var(--color-card-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
}

dt {
  font-weight: 600;
  color: var(--color-text-soft);
}

dd {
  margin: 0;
  color: var(--color-text);
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
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
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1976d2;
  margin: 0;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-link {
  display: block;
  padding: 1rem;
  background: #f5f5f5;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.2s;
}

.action-link:hover {
  background: #e3f2fd;
}

.btn {
  width: 100%;
  padding: 1rem;
  border-radius: 4px;
  border: 2px solid #1976d2;
  background: transparent;
  color: #1976d2;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.btn--secondary:hover {
  background: #e3f2fd;
}

.no-user {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
}

.no-user .btn {
  margin-top: 1rem;
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #1976d2;
  color: white;
  text-decoration: none;
  width: auto;
}
</style>
