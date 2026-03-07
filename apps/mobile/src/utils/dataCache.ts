import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'kk_cache_';

interface CachedItem<T> {
  data: T;
  cachedAt: number;
}

/**
 * Save data to local cache with a timestamp.
 */
export async function cacheData<T>(key: string, data: T): Promise<void> {
  try {
    const item: CachedItem<T> = {
      data,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    console.warn('[DataCache] Failed to cache data:', key, error);
  }
}

/**
 * Get cached data if it exists and is still fresh.
 * @param key Cache key
 * @param maxAgeMs Maximum age in milliseconds (default: 5 minutes)
 * @returns The cached data or null if stale/missing
 */
export async function getCachedData<T>(key: string, maxAgeMs: number = 5 * 60 * 1000): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const item: CachedItem<T> = JSON.parse(raw);
    const age = Date.now() - item.cachedAt;

    if (age > maxAgeMs) return null;

    return item.data;
  } catch (error) {
    console.warn('[DataCache] Failed to read cache:', key, error);
    return null;
  }
}

/**
 * Get cached data regardless of age (for instant UI, then refresh in background).
 */
export async function getCachedDataAnyAge<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const item: CachedItem<T> = JSON.parse(raw);
    return item.data;
  } catch (error) {
    return null;
  }
}

/**
 * Clear a specific cache key.
 */
export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn('[DataCache] Failed to clear cache:', key, error);
  }
}

// Cache keys used throughout the app
export const CACHE_KEYS = {
  DONOR_DASHBOARD: 'donor_dashboard',
  RECIPIENT_DASHBOARD: 'recipient_dashboard',
  PROFILE_DATA: 'profile_data',
  DONOR_STATS: 'donor_stats',
  RECIPIENT_STATS: 'recipient_stats',
};
