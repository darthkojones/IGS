<template>
  <router-link :to="to" class="quick-access-tile">
    <div class="tile-icon">{{ icon }}</div>
    <div class="tile-text">{{ title }}</div>
    <p v-if="description" class="tile-description">{{ description }}</p>
  </router-link>
</template>

<script setup lang="ts">
interface Props {
  to: string;
  icon: string;
  title: string;
  description?: string;
}

defineProps<Props>();
</script>

<style scoped>
.quick-access-tile {
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

.quick-access-tile:hover {
  border-color: #1976d2;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.tile-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.tile-text {
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.tile-description {
  font-size: 0.875rem;
  color: #666;
  text-align: center;
  margin-top: 0.75rem;
  line-height: 1.4;
  margin-bottom: 0;
}
</style>
