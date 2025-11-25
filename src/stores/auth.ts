import { defineStore } from 'pinia';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: {
      userId: 'user-123',
      firstName: 'Demo',
      lastName: 'User',
      name: 'Demo User',
      role: 'student' as UserRole,
    },
    isAuthenticated: true,
    token: 'demo-token',
  }),

  getters: {
    currentUser: (state) => state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isStaff: (state) => state.user?.role === 'staff' || state.user?.role === 'admin',
  },

  actions: {
    async login(email: string, password: string) {
      // TODO: Implement API call
      // For now, mock authentication
      this.user = {
        userId: '1',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        role: 'student' as UserRole,
      };
      this.isAuthenticated = true;
      this.token = 'mock-token';
    },

    async logout() {
      this.user = null;
      this.isAuthenticated = false;
      this.token = null;
    },

    async register(userData: Partial<User>) {
      // TODO: Implement API call
      console.log('Register:', userData);
    },
  },
});
