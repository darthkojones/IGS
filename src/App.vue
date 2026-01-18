<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import BurgerMenu from '@/components/BurgerMenu.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.currentUser)

onMounted(async () => {
  // Initialize theme
  themeStore.initTheme()

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
          <ThemeToggle />
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
  background: var(--color-background);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  background: var(--color-background);
  color: var(--color-text);
}

/* Header */
.app-header {
  background: var(--color-header-bg);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  margin: 0%;
  z-index: 100;
  width: 100%;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.header-content {
  /* max-width: 1400px;*/
  margin: 0;
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
  color: var(--color-primary);
  font-size: 1.5rem;
  font-weight: 700;
  transition: color 0.3s ease;
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
  color: var(--color-text);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s ease, color 0.3s ease;
}

.user-info:hover {
  background: var(--color-card-hover);
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
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.btn--primary:hover {
  background: var(--color-primary-hover);
}

.btn--outline {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn--outline:hover {
  background: var(--color-primary-light);
}

/* Main Content */
.app-main {
  flex: 1;
  width:100%;
  background: var(--color-background);
  transition: background-color 0.3s ease;
}

/* Footer */
.app-footer {
  background: var(--color-footer-bg);
  color: var(--color-footer-text);
  padding: 2rem;
  margin-top: 4rem;
  transition: background-color 0.3s ease, color 0.3s ease;
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
  color: var(--color-footer-text);
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
  .header-content {
    padding: 1% 3%;
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
