import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PresenceState {
  [userId: string]: {
    online: boolean;
    lastSeen: string;
  };
}

interface PresenceContextType {
  isUserOnline: (userId: string) => boolean;
  getUserLastSeen: (userId: string) => string | null;
  presenceState: PresenceState;
}

const PresenceContext = createContext<PresenceContextType>({
  isUserOnline: () => false,
  getUserLastSeen: () => null,
  presenceState: {},
});

export const usePresence = () => useContext(PresenceContext);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Track own presence globally
  const trackPresence = useCallback(async () => {
    if (!user?.id || !channelRef.current) return;

    try {
      await channelRef.current.track({
        odOd: user.id,
        odOdame: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        online_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Presence] Failed to track presence:', err);
    }
  }, [user?.id, user?.firstName, user?.lastName]);

  // Untrack presence
  const untrackPresence = useCallback(async () => {
    if (!channelRef.current) return;
    
    try {
      await channelRef.current.untrack();
    } catch (err) {
      console.error('[Presence] Failed to untrack presence:', err);
    }
  }, []);

  // Update presence state from channel
  const updatePresenceState = useCallback(() => {
    if (!channelRef.current) return;

    const state = channelRef.current.presenceState();
    const newPresenceState: PresenceState = {};

    Object.keys(state).forEach((key) => {
      const presences = state[key];
      if (presences && presences.length > 0) {
        const presence = presences[0];
        if (presence.odOd) {
          newPresenceState[presence.odOd] = {
            online: true,
            lastSeen: presence.online_at || new Date().toISOString(),
          };
        }
      }
    });

    setPresenceState(newPresenceState);
  }, []);

  // Initialize global presence channel
  useEffect(() => {
    if (!user?.id) return;

    // Create a global presence channel for all users
    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        updatePresenceState();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] User joined:', key);
        updatePresenceState();
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] User left:', key);
        // Mark user as offline
        if (leftPresences && leftPresences.length > 0) {
          const leftUserId = leftPresences[0].odOd;
          if (leftUserId) {
            setPresenceState(prev => ({
              ...prev,
              [leftUserId]: {
                online: false,
                lastSeen: new Date().toISOString(),
              },
            }));
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Presence] Global presence channel connected');
          await trackPresence();
        }
      });

    // Heartbeat to keep presence alive (every 30 seconds)
    heartbeatRef.current = setInterval(() => {
      trackPresence();
    }, 30000);

    // Handle app state changes
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - track presence
        console.log('[Presence] App active - tracking presence');
        await trackPresence();
      } else if (nextAppState === 'background') {
        // App went to background - keep presence (user can still receive notifications)
        // Only untrack if app is being terminated, which we can't detect
        console.log('[Presence] App backgrounded - maintaining presence');
        // Still track to refresh the heartbeat
        await trackPresence();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      subscription.remove();
      untrackPresence();
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, trackPresence, untrackPresence, updatePresenceState]);

  const isUserOnline = useCallback((userId: string): boolean => {
    return presenceState[userId]?.online ?? false;
  }, [presenceState]);

  const getUserLastSeen = useCallback((userId: string): string | null => {
    return presenceState[userId]?.lastSeen ?? null;
  }, [presenceState]);

  return (
    <PresenceContext.Provider value={{ isUserOnline, getUserLastSeen, presenceState }}>
      {children}
    </PresenceContext.Provider>
  );
}
