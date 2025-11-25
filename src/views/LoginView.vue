<template>
  <div class="login-view">
    <div class="login-container">
      <h1>Login</h1>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
            aria-required="true"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            autocomplete="current-password"
            aria-required="true"
          />
        </div>

        <div v-if="error" class="error-message" role="alert">
          {{ error }}
        </div>

        <button
          type="submit"
          class="btn btn--primary btn--full"
          :disabled="loading"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p class="register-link">
        Don't have an account?
        <router-link to="/register">Register here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const loading = ref(false);
const error = ref<string | null>(null);

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    await authStore.login(form.email, form.password);
    const redirect = route.query.redirect as string || '/';
    router.push(redirect);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-view {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.login-container h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.error-message {
  padding: 0.75rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.btn--full {
  width: 100%;
  padding: 0.875rem;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.register-link a {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}
</style>
