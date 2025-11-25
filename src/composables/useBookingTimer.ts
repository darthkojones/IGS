import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useBookingTimer(startTime: Date, durationMinutes: number = 5) {
  const timeRemaining = ref(0);
  const isExpired = ref(false);
  let intervalId: number | null = null;

  const calculateTimeRemaining = () => {
    const now = new Date();
    const start = new Date(startTime);
    const expiryTime = new Date(start.getTime() + durationMinutes * 60000);
    const diff = expiryTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      timeRemaining.value = 0;
      isExpired.value = true;
      if (intervalId) clearInterval(intervalId);
      return;
    }
    
    timeRemaining.value = Math.floor(diff / 1000);
  };

  const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60);
    const seconds = timeRemaining.value % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  const startTimer = () => {
    calculateTimeRemaining();
    intervalId = window.setInterval(calculateTimeRemaining, 1000);
  };

  const stopTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  onMounted(() => {
    startTimer();
  });

  onUnmounted(() => {
    stopTimer();
  });

  return {
    timeRemaining,
    formattedTime,
    isExpired,
    startTimer,
    stopTimer,
  };
}
