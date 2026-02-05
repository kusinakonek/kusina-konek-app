import { prisma } from "@kusinakonek/database";

// ============================================================
// Type Definitions
// ============================================================

export interface DonorStats {
    totalDonated: number;
    availableItems: number;
    averageRating: number;
}

export interface RecipientStats {
    availableFoods: number;
    locations: number;
    totalServings: number;
}

export interface DonorDonationItem {
    disID: string;
    foodName: string;
    quantity: number;
    status: string;
    location: string;
    timestamp: Date;
    claimedBy: string | null;
    rating: number | null;
}

export interface RecipientFoodItem {
    disID: string;
    foodName: string;
    quantity: number;
    status: string;
    location: string;
    timestamp: Date;
    canGiveFeedback: boolean;
    myRating: number | null;
    myComment: string | null;
}

export interface AvailableFoodItem {
    disID: string;
    foodName: string;
    quantity: number;
    description: string | null;
    image: string | null;
    location: string;
    streetAddress: string;
    donorName: string;
    scheduledTime: Date;
    timestamp: Date;
}

// ============================================================
// Dashboard Repository - "TypeScript Stored Procedures"
// ============================================================

export const dashboardRepository = {
    /**
     * Get donor dashboard statistics
     * Counts: total donated, available items, average rating
     */
    async getDonorStats(userID: string): Promise<DonorStats> {
        const [totalDonated, availableItems, avgRating] = await Promise.all([
            // Count completed distributions (donations that were delivered)
            // Using actualTime as fallback until Prisma is regenerated with status field
            prisma.distribution.count({
                where: {
                    donorID: userID,
                    actualTime: { not: null }
                }
            }),

            // Count food items the donor has available
            prisma.food.count({
                where: { userID: userID }
            }),

            // Calculate average rating from feedback received
            prisma.feedback.aggregate({
                where: { donorID: userID },
                _avg: { ratingScore: true }
            })
        ]);

        return {
            totalDonated,
            availableItems,
            averageRating: Math.round((avgRating._avg.ratingScore ?? 0) * 10) / 10
        };
    },

    /**
     * Get donor's recent donations for the home page list
     */
    async getDonorRecentDonations(userID: string, limit: number = 10): Promise<DonorDonationItem[]> {
        const distributions = await prisma.distribution.findMany({
            where: { donorID: userID },
            orderBy: { timestamp: "desc" },
            take: limit,
            include: {
                food: true,
                location: true,
                recipient: true,
                feedbacks: {
                    where: { donorID: userID },
                    take: 1
                }
            }
        });

        return distributions.map((d) => {
            // Use actualTime to determine status until Prisma is regenerated with status field
            const derivedStatus = d.actualTime ? "completed" : "pending";
            return {
                disID: d.disID,
                foodName: d.food.foodName,
                quantity: d.quantity,
                status: derivedStatus,
                location: d.location.barangay,
                timestamp: d.timestamp,
                claimedBy: d.actualTime
                    ? `${d.recipient.firstName} ${d.recipient.lastName}`
                    : null,
                rating: d.feedbacks[0]?.ratingScore ?? null
            };
        });
    },

    /**
     * Get recipient dashboard statistics
     * Counts: available foods, distinct locations, total servings
     */
    async getRecipientStats(userID: string): Promise<RecipientStats> {
        const [availableFoods, locationData, servingsData] = await Promise.all([
            // Count available distributions (pending - not yet completed)
            // Using actualTime as fallback until Prisma is regenerated with status field
            prisma.distribution.count({
                where: {
                    actualTime: null
                }
            }),

            // Count distinct locations with available food
            prisma.dropOffLocation.findMany({
                where: {
                    distributions: {
                        some: {
                            actualTime: null
                        }
                    }
                },
                select: { locID: true }
            }),

            // Sum total servings available
            prisma.distribution.aggregate({
                where: {
                    actualTime: null
                },
                _sum: { quantity: true }
            })
        ]);

        return {
            availableFoods,
            locations: locationData.length,
            totalServings: servingsData._sum.quantity ?? 0
        };
    },

    /**
     * Get recipient's recent food items for the home page list
     */
    async getRecipientRecentFoods(userID: string, limit: number = 10): Promise<RecipientFoodItem[]> {
        const distributions = await prisma.distribution.findMany({
            where: { recipientID: userID },
            orderBy: { timestamp: "desc" },
            take: limit,
            include: {
                food: true,
                location: true,
                feedbacks: {
                    where: { recipientID: userID },
                    take: 1
                }
            }
        });

        return distributions.map((d) => {
            const myFeedback = d.feedbacks[0];
            // Use actualTime to determine status until Prisma is regenerated with status field
            const isCompleted = d.actualTime !== null;
            const derivedStatus = isCompleted ? "completed" : "pending";
            const hasFeedback = !!myFeedback;

            return {
                disID: d.disID,
                foodName: d.food.foodName,
                quantity: d.quantity,
                status: derivedStatus,
                location: d.location.barangay,
                timestamp: d.timestamp,
                canGiveFeedback: isCompleted && !hasFeedback,
                myRating: myFeedback?.ratingScore ?? null,
                myComment: myFeedback?.comments ?? null
            };
        });
    },

    /**
     * Get all available foods for browsing (recipient browse food feature)
     */
    async getAvailableFoods(limit: number = 20): Promise<AvailableFoodItem[]> {
        const distributions = await prisma.distribution.findMany({
            where: {
                actualTime: null // Use actualTime as fallback until Prisma is regenerated
            },
            orderBy: { timestamp: "desc" },
            take: limit,
            include: {
                food: true,
                location: true,
                donor: {
                    select: {
                        firstName: true,
                        lastName: true,
                        orgName: true,
                        isOrg: true
                    }
                }
            }
        });

        return distributions.map((d) => ({
            disID: d.disID,
            foodName: d.food.foodName,
            quantity: d.quantity,
            description: d.food.description,
            image: d.food.image,
            location: d.location.barangay,
            streetAddress: d.location.streetAddress,
            donorName: d.donor.isOrg
                ? (d.donor.orgName ?? "Organization")
                : `${d.donor.firstName} ${d.donor.lastName}`,
            scheduledTime: d.scheduledTime,
            timestamp: d.timestamp
        }));
    }
};
