import { HttpError } from "../middlewares/errorHandler";
import { dashboardRepository, userRepository } from "../repositories";
import { sha256Hex } from "../utils/hash";

// ============================================================
// Helper Functions
// ============================================================

const ensureProfile = async (email: string) => {
    const emailHash = sha256Hex(email.toLowerCase());
    const profile = await userRepository.getByEmailHash(emailHash);
    if (!profile) throw new HttpError(400, "Complete your profile first");
    return profile;
};

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
     * Returns stats and recent donations for the donor home page
     */
    async getDonorDashboard(email: string) {
        const profile = await ensureProfile(email);
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
            }))
        };
    },

    /**
     * Get Recipient Dashboard data
     * Returns stats and recent foods for the recipient home page
     */
    async getRecipientDashboard(email: string) {
        const profile = await ensureProfile(email);
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
            }))
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
