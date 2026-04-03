import { dashboardRepository, userRepository } from "../repositories";
import { sha256Hex } from "../utils/hash";

// ============================================================
// Helper Functions
// ============================================================

type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

const PROFILE_CACHE_TTL_MS = 15_000;
const DASHBOARD_CACHE_TTL_MS = 8_000;
const MAX_CACHE_ENTRIES = 500;

const profileCache = new Map<string, CacheEntry<any>>();
const donorDashboardCache = new Map<string, CacheEntry<any>>();
const recipientDashboardCache = new Map<string, CacheEntry<any>>();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getCachedValue = <T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined => {
    const cached = cache.get(key);
    if (!cached) return undefined;
    if (cached.expiresAt < Date.now()) {
        cache.delete(key);
        return undefined;
    }
    return cached.value;
};

const cleanupCache = <T>(cache: Map<string, CacheEntry<T>>) => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (value.expiresAt < now) {
            cache.delete(key);
        }
    }

    if (cache.size <= MAX_CACHE_ENTRIES) {
        return;
    }

    const keys = Array.from(cache.keys());
    const keysToDelete = keys.slice(0, Math.floor(keys.length / 2));
    for (const key of keysToDelete) {
        cache.delete(key);
    }
};

const setCachedValue = <T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    value: T,
    ttlMs: number,
) => {
    if (cache.size >= MAX_CACHE_ENTRIES) {
        cleanupCache(cache);
    }

    cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
    });
};

/**
 * Find a user's profile by email. Returns null if not found (no error thrown).
 */
const findProfile = async (email: string) => {
    const emailKey = normalizeEmail(email);
    const cachedProfile = getCachedValue(profileCache, emailKey);
    if (cachedProfile !== undefined) {
        return cachedProfile;
    }

    const emailHash = sha256Hex(emailKey);
    const profile = await userRepository.getByEmailHash(emailHash);
    setCachedValue(profileCache, emailKey, profile ?? null, PROFILE_CACHE_TTL_MS);
    return profile;
};

/** Empty stats returned when user has no profile yet */
const EMPTY_DONOR_STATS = { totalDonated: 0, availableItems: 0, averageRating: "N/A", familiesHelped: 0, unreadNotifications: 0 };
const EMPTY_RECIPIENT_STATS = { availableFoods: 0, locations: 0, totalServings: 0, totalReceived: 0, activeNow: 0, unreadNotifications: 0 };

/**
 * Calculate relative time string (e.g., "1 day ago", "2 hours ago")
 */
const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
};

// ============================================================
// Dashboard Service
// ============================================================

export const dashboardService = {
    /**
     * Get Donor Dashboard data
     * Returns stats and recent donations for the donor home page.
     * If the user has no profile yet, returns zeroed-out stats and empty lists.
     */
    async getDonorDashboard(email: string) {
        const emailKey = normalizeEmail(email);
        const cachedDashboard = getCachedValue(donorDashboardCache, emailKey);
        if (cachedDashboard !== undefined) {
            return cachedDashboard;
        }

        const profile = await findProfile(email);

        if (!profile) {
            const emptyResult = { stats: EMPTY_DONOR_STATS, recentDonations: [], profileCompleted: false };
            setCachedValue(donorDashboardCache, emailKey, emptyResult, DASHBOARD_CACHE_TTL_MS);
            return emptyResult;
        }

        const userID = profile.userID;

        const [stats, recentDonations] = await Promise.all([
            dashboardRepository.getDonorStats(userID),
            dashboardRepository.getDonorRecentDonations(userID, 10)
        ]);

        const result = {
            stats: {
                totalDonated: stats.totalDonated,
                availableItems: stats.availableItems,
                averageRating: stats.averageRating,
                familiesHelped: stats.familiesHelped,
                unreadNotifications: stats.unreadNotifications
            },
            recentDonations: recentDonations.map((donation) => ({
                ...donation,
                timeAgo: getTimeAgo(donation.timestamp)
            })),
            profileCompleted: true
        };

        setCachedValue(donorDashboardCache, emailKey, result, DASHBOARD_CACHE_TTL_MS);
        return result;
    },

    /**
     * Get Recipient Dashboard data
     * Returns stats and recent foods for the recipient home page.
     * If the user has no profile yet, returns zeroed-out stats and empty lists.
     */
    async getRecipientDashboard(email: string) {
        const emailKey = normalizeEmail(email);
        const cachedDashboard = getCachedValue(recipientDashboardCache, emailKey);
        if (cachedDashboard !== undefined) {
            return cachedDashboard;
        }

        const profile = await findProfile(email);

        if (!profile) {
            const emptyResult = { stats: EMPTY_RECIPIENT_STATS, recentFoods: [], profileCompleted: false };
            setCachedValue(recipientDashboardCache, emailKey, emptyResult, DASHBOARD_CACHE_TTL_MS);
            return emptyResult;
        }

        const userID = profile.userID;

        const [stats, recentFoods] = await Promise.all([
            dashboardRepository.getRecipientStats(userID),
            dashboardRepository.getRecipientRecentFoods(userID, 10)
        ]);

        const result = {
            stats: {
                availableFoods: stats.availableFoods,
                locations: stats.locations,
                totalServings: stats.totalServings,
                totalReceived: stats.totalReceived,
                activeNow: stats.activeNow,
                unreadNotifications: stats.unreadNotifications
            },
            recentFoods: recentFoods.map((food) => ({
                ...food,
                timeAgo: getTimeAgo(food.timestamp)
            })),
            profileCompleted: true
        };

        setCachedValue(recipientDashboardCache, emailKey, result, DASHBOARD_CACHE_TTL_MS);
        return result;
    },

    /**
     * Get available foods for browsing (recipient feature)
     */
    async getAvailableFoods() {
        const foods = await dashboardRepository.getAvailableFoods(20);
        return { foods };
    }
};
