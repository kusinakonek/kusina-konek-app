import { dashboardRepository, userRepository } from "../repositories";
import { sha256Hex } from "../utils/hash";

// ============================================================
// Helper Functions
// ============================================================

/**
 * Find a user's profile by email. Returns null if not found (no error thrown).
 */
const findProfile = async (email: string) => {
    const emailHash = sha256Hex(email.toLowerCase());
    return await userRepository.getByEmailHash(emailHash);
};

/** Empty stats returned when user has no profile yet */
const EMPTY_DONOR_STATS = { totalDonated: 0, availableItems: 0, averageRating: "N/A" };
const EMPTY_RECIPIENT_STATS = { availableFoods: 0, locations: 0, totalServings: 0 };

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
        const profile = await findProfile(email);

        if (!profile) {
            return { stats: EMPTY_DONOR_STATS, recentDonations: [], profileCompleted: false };
        }

        const userID = profile.userID;

        const [stats, recentDonations] = await Promise.all([
            dashboardRepository.getDonorStats(userID),
            dashboardRepository.getDonorRecentDonations(userID, 10)
        ]);

        return {
            stats: {
                totalDonated: stats.totalDonated,
                availableItems: stats.availableItems,
                averageRating: stats.averageRating
            },
            recentDonations: recentDonations.map((donation) => ({
                ...donation,
                timeAgo: getTimeAgo(donation.timestamp)
            })),
            profileCompleted: true
        };
    },

    /**
     * Get Recipient Dashboard data
     * Returns stats and recent foods for the recipient home page.
     * If the user has no profile yet, returns zeroed-out stats and empty lists.
     */
    async getRecipientDashboard(email: string) {
        const profile = await findProfile(email);

        if (!profile) {
            return { stats: EMPTY_RECIPIENT_STATS, recentFoods: [], profileCompleted: false };
        }

        const userID = profile.userID;

        const [stats, recentFoods] = await Promise.all([
            dashboardRepository.getRecipientStats(userID),
            dashboardRepository.getRecipientRecentFoods(userID, 10)
        ]);

        return {
            stats: {
                availableFoods: stats.availableFoods,
                locations: stats.locations,
                totalServings: stats.totalServings
            },
            recentFoods: recentFoods.map((food) => ({
                ...food,
                timeAgo: getTimeAgo(food.timestamp)
            })),
            profileCompleted: true
        };
    },

    /**
     * Get available foods for browsing (recipient feature)
     */
    async getAvailableFoods() {
        const foods = await dashboardRepository.getAvailableFoods(20);
        return { foods };
    }
};
