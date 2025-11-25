import type { Statistics } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const statisticsService = {
  async getRoomStatistics(roomId: string, startDate?: Date, endDate?: Date): Promise<Statistics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const response = await fetch(`${API_BASE_URL}/statistics/rooms/${roomId}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch room statistics');
    return response.json();
  },

  async getOverallStatistics(startDate?: Date, endDate?: Date): Promise<Statistics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const response = await fetch(`${API_BASE_URL}/statistics/overall?${params}`);
    if (!response.ok) throw new Error('Failed to fetch overall statistics');
    return response.json();
  },

  async getMostPopularRooms(limit: number = 10): Promise<Array<{ roomId: string; stats: Statistics }>> {
    const response = await fetch(`${API_BASE_URL}/statistics/popular-rooms?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch popular rooms');
    return response.json();
  },

  async getUsageReport(buildingId?: string): Promise<any> {
    const params = buildingId ? `?buildingId=${buildingId}` : '';
    const response = await fetch(`${API_BASE_URL}/statistics/usage-report${params}`);
    if (!response.ok) throw new Error('Failed to fetch usage report');
    return response.json();
  },
};
