<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BurgerMenu from '@/components/BurgerMenu.vue'


const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.currentUser)

onMounted(async () => {
  // Attempt to populate current user from the API/local storage on app start
  // Only call fetchCurrentUser when we have a token saved — avoids clearing
  // local user state if the test API doesn't implement `/auth/me`.
  if (authStore.token) await authStore.fetchCurrentUser();
})
</script>

<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <RouterLink to="/" class="logo">
          <span class="logo-icon">🏢</span>
          <span class="logo-text">Home</span>
        </RouterLink>

        <div class="header-spacer"></div>

        <div class="header-actions">
          <BurgerMenu />
          <template v-if="isAuthenticated">
            <RouterLink to="/profile" class="user-info">
              <span class="user-icon">👤</span>
              <span class="user-name">{{ currentUser?.firstName || 'User' }}-{{ currentUser?.lastName || '' }}</span>
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/login" class="btn btn--outline">Login</RouterLink>
            <RouterLink to="/register" class="btn btn--primary">Sign Up</RouterLink>
          </template>
        </div>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; 2025 MCI - Integrative Project</p>
        <div class="footer-links">
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/accessibility">Accessibility</RouterLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
  color: #333;
  display: flex;
  flex-direction: column;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

/* Header */
.app-header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.header-spacer {
  flex: 1;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #1976d2;
  font-size: 1.5rem;
  font-weight: 700;
}

.logo-icon {
  font-size: 2rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.user-info:hover {
  background: #f5f5f5;
}

.user-icon {
  font-size: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-block;
}

.btn--primary {
  background: #1976d2;
  color: white;
}

.btn--primary:hover {
  background: #1565c0;
}

.btn--outline {
  background: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.btn--outline:hover {
  background: #e3f2fd;
}

/* Main Content */
.app-main {
  flex: 1;
}

/* Footer */
.app-footer {
  background: #333;
  color: white;
  padding: 2rem;
  margin-top: 4rem;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-links a {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.footer-links a:hover {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    width:100%
  }

  .user-name {
    display: none;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

/* Accessibility */
.high-contrast {
  --bg-color: #000;
  --text-color: #fff;
}

.font-large {
  font-size: 1.125rem;
}

.font-extra-large {
  font-size: 1.25rem;
}

.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
