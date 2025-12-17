import { defineStore } from 'pinia';
import type { User } from '@/types';
// since we are using authServices to register , login and logout. we need to import it
import { authService as authServices } from '@/services/authService';
import type { AuthLoginResponse } from '@/services/authService';
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    // Initialize from localStorage if available so router guards can read auth state on startup
    user: (() => {
      try {
        const raw = localStorage.getItem('auth.user');
        return raw ? (JSON.parse(raw) as User) : null;
      } catch {
        return null;
      }
    })(),
    isAuthenticated: !!localStorage.getItem('auth.token'),
    token: localStorage.getItem('auth.token'),
  }),

  getters: {
    currentUser: (state) => state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isStaff: (state) => state.user?.role === 'staff' || state.user?.role === 'admin',
  },

  actions: {
    async login(email: string, password: string) {
      // Call authService.login once and use its returned shape
      const res: AuthLoginResponse = await authServices.login(email, password);
      // Expecting res to contain { user, token }
      this.user = res.user ?? null;
      this.token = res.token ?? null;
      // Consider the user authenticated when a valid token is present. Some test APIs
      // return minimal user data or none at all, so token is a more reliable signal.
      this.isAuthenticated = !!this.token;

      // Persist login for page reloads
      try {
        if (this.token) localStorage.setItem('auth.token', this.token);
        if (this.user) localStorage.setItem('auth.user', JSON.stringify(this.user));
      } catch {
        // ignore storage errors
      }
    },

    async logout() {
      // logout logic should be handled in authService
      authServices.logout();
      this.user = null;
      this.isAuthenticated = false;
      this.token = null;

      try {
        localStorage.removeItem('auth.token');
        localStorage.removeItem('auth.user');
      } catch {
        // ignore
      }
    },

    async register(userData: Partial<User> & { email: string; password: string }) {
      // Call authService to register and store returned user/token
      const res = await authServices.register(userData)
      this.user = res.user
      this.token = res.token
      this.isAuthenticated = !!this.token
      try {
        if (this.token) localStorage.setItem('auth.token', this.token)
        if (this.user) localStorage.setItem('auth.user', JSON.stringify(this.user))
      } catch {}
    },

    async fetchCurrentUser() {
      // Only attempt server fetch when we have a token
      if (!this.token) {
        // No token — ensure state reflects unauthenticated
        this.user = null;
        this.isAuthenticated = false;
        return null;
      }

      try {
        const user = await authServices.getCurrentUser();
        this.user = user ?? this.user;
        // Keep authenticated state based on token presence
        this.isAuthenticated = !!this.token;
        // Persist the updated user if we got one
        if (user) {
          try { localStorage.setItem('auth.user', JSON.stringify(user)); } catch {}
        }
        return user;
      } catch (err) {
        // If the API call fails (test API may not support /auth/me), don't wipe
        // existing local user/token. Leave token-based authentication intact.
        console.error('fetchCurrentUser failed', err);
        this.isAuthenticated = !!this.token;
        return null;
      }
    },
  },
});
