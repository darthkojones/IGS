import { defineStore } from 'pinia';
import type { Statistics } from '@/types';

interface StatisticsState {
  roomStatistics: Map<string, Statistics>;
  overallStatistics: Statistics | null;
  loading: boolean;
  error: string | null;
}

export const useStatisticsStore = defineStore('statistics', {
  state: (): StatisticsState => ({
    roomStatistics: new Map(),
    overallStatistics: null,
    loading: false,
    error: null,
  }),

  getters: {
    getMostPopularRooms: (state) => {
      const stats = Array.from(state.roomStatistics.entries())
        .map(([roomId, stats]) => ({ roomId, ...stats }))
        .sort((a, b) => b.usageFrequency - a.usageFrequency);
      return stats.slice(0, 5);
    },
  },

  actions: {
    async fetchRoomStatistics(roomId: string) {
      this.loading = true;
      try {
        // TODO: Implement API call
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch statistics';
      } finally {
        this.loading = false;
      }
    },

    async fetchOverallStatistics() {
      this.loading = true;
      try {
        // TODO: Implement API call
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch statistics';
      } finally {
        this.loading = false;
      }
    },
  },
});
