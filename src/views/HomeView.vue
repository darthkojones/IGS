<template>
  <div class="home-view">
    <section class="hero">
      <div class="hero-content">
        <h1>Meeting Room Booking System</h1>
        <p class="hero-subtitle">
          Reserve meeting rooms at MCI with ease. Real-time availability, instant booking, and smart room management.
        </p>
        <div class="hero-actions">
          <router-link to="/rooms" class="btn btn--primary btn--large">
            Browse Rooms
          </router-link>
          <router-link to="/bookings" class="btn btn--secondary btn--large">
            My Bookings
          </router-link>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🏢</div>
          <h3>Browse Rooms</h3>
          <p>View available meeting rooms across all campus buildings with real-time availability.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📅</div>
          <h3>Quick Booking</h3>
          <p>Reserve rooms instantly with our simple booking process. Get confirmation in seconds.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3>Visual Status</h3>
          <p>Color-coded room status: Green (available), Yellow (reserved), Red (occupied).</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">⏱️</div>
          <h3>Smart Entry</h3>
          <p>5-minute window to enter your booked room via QR code, NFC, or motion sensor.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">♿</div>
          <h3>Accessible</h3>
          <p>WCAG compliant with high contrast, screen reader support, and keyboard navigation.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Statistics</h3>
          <p>Track room usage, peak hours, and booking patterns with comprehensive analytics.</p>
        </div>
      </div>
    </section>

    <section class="quick-access">
      <h2>Quick Access</h2>
      <div class="quick-links">
        <router-link to="/rooms" class="quick-link">
          <span class="quick-link-icon">🔍</span>
          <span class="quick-link-text">Find a Room</span>
        </router-link>
        <router-link to="/bookings/new" class="quick-link">
          <span class="quick-link-icon">➕</span>
          <span class="quick-link-text">New Booking</span>
        </router-link>
        <router-link to="/bookings" class="quick-link">
          <span class="quick-link-icon">📋</span>
          <span class="quick-link-text">My Bookings</span>
        </router-link>
        <router-link to="/accessibility" class="quick-link">
          <span class="quick-link-icon">⚙️</span>
          <span class="quick-link-text">Accessibility</span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

onMounted(() => {
  // You can add any initialization logic here
});
</script>

<style scoped>
.home-view {
  min-height: 100vh;
}

.hero {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.features {
  padding: 4rem 2rem;
  background: #f5f5f5;
}

.features-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

.quick-access {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.quick-access h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
}

.quick-link:hover {
  border-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.quick-link-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.quick-link-text {
  font-size: 1.125rem;
  font-weight: 500;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s ease;
}

.btn--large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.btn--primary {
  background: white;
  color: #1976d2;
}

.btn--primary:hover {
  background: #f5f5f5;
}

.btn--secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn--secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
