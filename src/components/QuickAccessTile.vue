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
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  min-height: 180px;
}

.quick-link:hover {
  border-color: #1976d2;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.quick-link-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.quick-link-text {
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.quick-link-description {
  font-size: 0.875rem;
  color: #666;
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
