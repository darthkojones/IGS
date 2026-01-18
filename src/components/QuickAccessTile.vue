<template>
  <router-link :to="to" class="quick-link">
    <div class="quick-link-icon">{{ icon }}</div>
    <div class="quick-link-text">{{ title }}</div>
    <p v-if="description" class="quick-link-description">{{ description }}</p>
  </router-link>
</template>

<script setup lang="ts">
defineProps<{
  to: string;
  icon: string;
  title: string;
  description?: string;
}>();
</script>

<style scoped>
.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--color-card-bg);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
  transition: all 0.3s ease;
  min-height: 180px;
}

.quick-link:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  background: var(--color-card-hover);
}

.quick-link-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.quick-link-text {
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  color: var(--color-heading);
}

.quick-link-description {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  text-align: center;
  margin-top: 0.75rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .quick-link {
    min-height: 150px;
  }
}
</style>
