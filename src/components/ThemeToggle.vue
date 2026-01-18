<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <span class="theme-toggle__icon">{{ isDarkMode ? '🌙' : '☀️' }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const isDarkMode = computed(() => themeStore.isDarkMode)

const toggleTheme = () => {
  themeStore.toggleTheme()
}
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: 2px solid var(--theme-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.theme-toggle:hover {
  background: var(--theme-hover);
  transform: scale(1.1);
  border-color: var(--theme-border-hover);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-toggle__icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.theme-toggle:hover .theme-toggle__icon {
  transform: rotate(20deg);
}

/* Theme-specific colors */
:root {
  --theme-border: #cbd5e0;
  --theme-border-hover: #1976d2;
  --theme-hover: rgba(25, 118, 210, 0.1);
}

:root.dark-theme {
  --theme-border: #4a5568;
  --theme-border-hover: #63b3ed;
  --theme-hover: rgba(99, 179, 237, 0.1);
}
</style>
