import type { Booking } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const bookingService = {
  async createBooking(bookingData: Omit<Booking, 'bookingId' | 'createdAt' | 'status'>): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error('Failed to create booking');
    return response.json();
  },

  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
    if (!response.ok) throw new Error('Failed to fetch booking');
    return response.json();
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/bookings`);
    if (!response.ok) throw new Error('Failed to fetch user bookings');
    return response.json();
  },

  async getRoomBookings(roomId: string, date?: Date): Promise<Booking[]> {
    const params = date ? `?date=${date.toISOString()}` : '';
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/bookings${params}`);
    if (!response.ok) throw new Error('Failed to fetch room bookings');
    return response.json();
  },

  async cancelBooking(bookingId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cancel booking');
  },

  async confirmEntry(bookingId: string, entryMethod: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/confirm-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryMethod }),
    });
    if (!response.ok) throw new Error('Failed to confirm entry');
  },

  async checkBookingValidity(bookingId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/validity`);
    if (!response.ok) throw new Error('Failed to check booking validity');
    const data = await response.json();
    return data.isValid;
  },
};
