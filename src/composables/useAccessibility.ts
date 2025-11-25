import { ref, computed } from 'vue';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  screenReaderMode: boolean;
  keyboardNavigationOnly: boolean;
  reducedMotion: boolean;
}

export function useAccessibility() {
  const settings = ref<AccessibilitySettings>({
    highContrast: false,
    fontSize: 'normal',
    screenReaderMode: false,
    keyboardNavigationOnly: false,
    reducedMotion: false,
  });

  // Load settings from localStorage
  const loadSettings = () => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      settings.value = { ...settings.value, ...JSON.parse(saved) };
      applySettings();
    }
  };

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings.value));
    applySettings();
  };

  // Apply settings to document
  const applySettings = () => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.value.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.classList.remove('font-normal', 'font-large', 'font-extra-large');
    root.classList.add(`font-${settings.value.fontSize}`);

    // Reduced motion
    if (settings.value.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Screen reader announcements
    root.setAttribute('aria-live', settings.value.screenReaderMode ? 'polite' : 'off');
  };

  const toggleHighContrast = () => {
    settings.value.highContrast = !settings.value.highContrast;
    saveSettings();
  };

  const setFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    settings.value.fontSize = size;
    saveSettings();
  };

  const toggleScreenReaderMode = () => {
    settings.value.screenReaderMode = !settings.value.screenReaderMode;
    saveSettings();
  };

  const toggleReducedMotion = () => {
    settings.value.reducedMotion = !settings.value.reducedMotion;
    saveSettings();
  };

  // Announce message for screen readers
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.value.screenReaderMode) return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  };

  return {
    settings,
    loadSettings,
    saveSettings,
    toggleHighContrast,
    setFontSize,
    toggleScreenReaderMode,
    toggleReducedMotion,
    announce,
  };
}
