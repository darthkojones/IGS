<template>
  <div class="accessibility-view">
    <h1>Accessibility Settings</h1>

    <div class="settings-container">
      <section class="setting-section">
        <h2>Visual Settings</h2>

        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              :checked="settings.highContrast"
              @change="toggleHighContrast"
            />
            <span>High Contrast Mode</span>
          </label>
          <p class="setting-description">
            Increases contrast between text and background for better visibility
          </p>
        </div>

        <div class="setting-item">
          <label for="font-size">Font Size</label>
          <select
            id="font-size"
            :value="settings.fontSize"
            @change="handleFontSizeChange"
            class="setting-select"
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
          <p class="setting-description">
            Adjust text size throughout the application
          </p>
        </div>

        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              :checked="settings.reducedMotion"
              @change="toggleReducedMotion"
            />
            <span>Reduce Motion</span>
          </label>
          <p class="setting-description">
            Minimize animations and transitions
          </p>
        </div>
      </section>

      <section class="setting-section">
        <h2>Screen Reader</h2>

        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              :checked="settings.screenReaderMode"
              @change="toggleScreenReaderMode"
            />
            <span>Enable Screen Reader Announcements</span>
          </label>
          <p class="setting-description">
            Provides audio announcements for important events and updates
          </p>
        </div>
      </section>

      <section class="setting-section">
        <h2>Keyboard Navigation</h2>
        <p>
          All interactive elements can be accessed using the keyboard:
        </p>
        <ul class="keyboard-shortcuts">
          <li><kbd>Tab</kbd> - Move to next element</li>
          <li><kbd>Shift + Tab</kbd> - Move to previous element</li>
          <li><kbd>Enter</kbd> or <kbd>Space</kbd> - Activate element</li>
          <li><kbd>Esc</kbd> - Close dialogs or cancel actions</li>
        </ul>
      </section>

      <section class="setting-section">
        <h2>WCAG Compliance</h2>
        <p>
          This application follows Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards:
        </p>
        <ul>
          <li>✓ Keyboard accessible</li>
          <li>✓ Screen reader compatible</li>
          <li>✓ Sufficient color contrast</li>
          <li>✓ Resizable text</li>
          <li>✓ Clear focus indicators</li>
          <li>✓ Alternative text for images</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAccessibility } from '@/composables/useAccessibility';

const {
  settings,
  loadSettings,
  toggleHighContrast,
  setFontSize,
  toggleScreenReaderMode,
  toggleReducedMotion,
  announce,
} = useAccessibility();

const handleFontSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  setFontSize(target.value as 'normal' | 'large' | 'extra-large');
  announce(`Font size changed to ${target.value}`);
};

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.accessibility-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--color-background);
  min-height: 100vh;
}

.accessibility-view h1 {
  margin-bottom: 2rem;
  color: var(--color-heading);
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.setting-section {
  background: var(--color-card-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

.setting-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.setting-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.setting-description {
  margin-top: 0.5rem;
  margin-left: 2rem;
  color: var(--color-text-soft);
  font-size: 0.875rem;
}

.setting-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  margin-top: 0.5rem;
  background: var(--color-card-bg);
  color: var(--color-text);
}

.keyboard-shortcuts {
  list-style: none;
  padding: 0;
}

.keyboard-shortcuts li {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--color-surface-soft);
  border-radius: 4px;
  color: var(--color-text);
}

kbd {
  padding: 0.25rem 0.5rem;
  background: var(--color-text);
  color: var(--color-background);
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Screen reader only class */
:global(.sr-only) {
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
