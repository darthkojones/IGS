import type { User } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async register(userData: Partial<User> & { email: string; password: string }): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`);
    if (!response.ok) throw new Error('Failed to fetch current user');
    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Logout failed');
  },
};
