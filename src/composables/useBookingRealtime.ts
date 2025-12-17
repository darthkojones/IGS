import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useBookingRealtime(userId: string, onUpdate: () => void) {
  let subscription: RealtimeChannel | null = null;

  const isConnected = ref(false);

  const subscribe = () => {
    if (!userId) return;

    subscription = supabase
      .channel(`bookings:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'booking',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          // Refresh bookings when any change is detected
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        isConnected.value = status === 'SUBSCRIBED';
      });
  };

  const unsubscribe = () => {
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
      isConnected.value = false;
    }
  };

  onMounted(() => {
    subscribe();
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    isConnected,
    subscribe,
    unsubscribe,
  };
}
