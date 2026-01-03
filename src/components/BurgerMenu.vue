<template>
  <div class="burger-menu">
    <!-- Burger Button -->
    <button
      class="burger-button"
      @click="toggleMenu"
      :aria-expanded="isOpen"
      aria-label="Toggle navigation menu"
    >
      <span class="burger-line" :class="{ open: isOpen }"></span>
      <span class="burger-line" :class="{ open: isOpen }"></span>
      <span class="burger-line" :class="{ open: isOpen }"></span>
    </button>

    <!-- Menu Overlay -->
    <transition name="fade">
      <div v-if="isOpen" class="menu-overlay" @click="closeMenu"></div>
    </transition>

    <!-- Menu Panel -->
    <transition name="slide">
      <nav v-if="isOpen" class="menu-panel">
        <div class="menu-header">
          <h2>Menu</h2>
          <button class="close-button" @click="closeMenu" aria-label="Close menu">
            ✕
          </button>
        </div>

        <div class="menu-items">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="menu-item"
            @click="closeMenu"
          >
            <span class="menu-item-icon">{{ item.icon }}</span>
            <span class="menu-item-text">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const isOpen = ref(false);

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

const allMenuItems: MenuItem[] = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/rooms', label: 'Rooms', icon: '🚪' },
   { path: '/room-editor', label: 'Room Editor', icon: '🗂️' },
  { path: '/bookings', label: 'Bookings', icon: '📋', requiresAuth: true },
  { path: '/statistics', label: 'Statistics', icon: '📊', requiresAuth: true },
  { path: '/accessibility', label: 'Accessibility', icon: '⚙️' },
  { path: '/profile', label: 'Profile', icon: '👤', requiresAuth: true },
  { path: '/about', label: 'About', icon: 'ℹ️' }
];

const menuItems = computed(() => {
  return allMenuItems.filter(item => {
    if (item.requiresAuth && !authStore.isAuthenticated) {
      return false;
    }
    if (item.requiresAdmin && !authStore.isAdmin) {
      return false;
    }
    return true;
  });
});

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
  // Prevent body scroll when menu is open
  document.body.style.overflow = isOpen.value ? 'hidden' : '';
};

const closeMenu = () => {
  isOpen.value = false;
  document.body.style.overflow = '';
};
</script>

<style scoped>
.burger-menu {
  position: relative;
}

/* Burger Button */
.burger-button {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1001;
  transition: transform 0.3s ease;
}

.burger-button:hover {
  transform: scale(1.1);
}

.burger-line {
  width: 100%;
  height: 3px;
  background: #333;
  border-radius: 10px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.burger-line.open:nth-child(1) {
  transform: rotate(45deg) translateY(8px);
}

.burger-line.open:nth-child(2) {
  opacity: 0;
  transform: translateX(-20px);
}

.burger-line.open:nth-child(3) {
  transform: rotate(-45deg) translateY(-8px);
}

/* Menu Overlay */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Menu Panel */
.menu-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.menu-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f5f5f5;
  color: #333;
}

/* Menu Items */
.menu-items {
  flex: 1;
  padding: 1rem 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.menu-item:hover {
  background: #f5f5f5;
  border-left-color: #1976d2;
}

.menu-item.router-link-active {
  background: #e3f2fd;
  border-left-color: #1976d2;
  color: #1976d2;
  font-weight: 600;
}

.menu-item-icon {
  font-size: 1.5rem;
  width: 2rem;
  text-align: center;
}

.menu-item-text {
  font-size: 1rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* Responsive */
@media (max-width: 768px) {
  .menu-panel {
    width: 100%;
    max-width: 300px;
  }
}
</style>
