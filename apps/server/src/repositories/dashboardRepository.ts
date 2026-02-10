import { prisma } from "@kusinakonek/database";
import { safeDecrypt } from "../utils/encryption";

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
  quantity: string;
  status: string;
  location: string | null;
  timestamp: Date;
  claimedBy: string | null;
  rating: number | null;
}

export interface RecipientFoodItem {
  disID: string;
  foodName: string;
  quantity: string;
  status: string;
  location: string | null;
  timestamp: Date;
  canGiveFeedback: boolean;
  myRating: number | null;
  myComment: string | null;
}

export interface AvailableFoodItem {
  disID: string;
  foodName: string;
  quantity: string;
  description: string | null;
  image: string | null;
  location: string | null;
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
      prisma.distribution.count({
        where: {
          donorID: userID,
          status: { in: ["DELIVERED", "COMPLETED"] },
        },
      }),

      // Count food items the donor has available
      prisma.food.count({
        where: { userID: userID },
      }),

      // Calculate average rating from feedback received
      prisma.feedback.aggregate({
        where: { donorID: userID },
        _avg: { ratingScore: true },
      }),
    ]);

    return {
      totalDonated,
      availableItems,
      averageRating: Math.round((avgRating._avg.ratingScore ?? 0) * 10) / 10,
    };
  },

  /**
   * Get donor's recent donations for the home page list
   */
  async getDonorRecentDonations(
    userID: string,
    limit: number = 10,
  ): Promise<DonorDonationItem[]> {
    const distributions = await prisma.distribution.findMany({
      where: { donorID: userID },
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        disID: true,
        quantity: true,
        status: true,
        timestamp: true,
        food: { select: { foodName: true } },
        location: { select: { barangay: true } },
        recipient: { select: { firstName: true, lastName: true } },
        feedbacks: {
          where: { donorID: userID },
          take: 1,
          select: { ratingScore: true },
        },
      },
    });

    return distributions.map((d) => {
      return {
        disID: d.disID,
        foodName: d.food.foodName,
        quantity: d.quantity,
        status: d.status.toLowerCase(),
        location: safeDecrypt(d.location.barangay),
        timestamp: d.timestamp,
        claimedBy:
          d.recipient
            ? `${safeDecrypt(d.recipient.firstName)} ${safeDecrypt(d.recipient.lastName)}`
            : null,
        rating: d.feedbacks[0]?.ratingScore ?? null,
      };
    });
  },

  /**
   * Get recipient dashboard statistics
   * Counts: available foods, distinct locations, total servings
   */
  async getRecipientStats(userID: string): Promise<RecipientStats> {
    // Single optimized query instead of 3 separate queries
    const [countResult, locationCount] = await Promise.all([
      prisma.distribution.aggregate({
        where: {
          status: "PENDING",
          recipientID: null,
        },
        _count: true,
        _sum: { quantity: true },
      }),
      prisma.dropOffLocation.count({
        where: {
          distributions: {
            some: {
              status: "PENDING",
            },
          },
        },
      }),
    ]);

    // Parse total servings
    const totalServings = parseInt(String(countResult._sum.quantity ?? '0'), 10) || 0;

    return {
      availableFoods: countResult._count,
      locations: locationCount,
      totalServings,
    };
  },

  /**
   * Get recipient's recent food items for the home page list
   */
  async getRecipientRecentFoods(
    userID: string,
    limit: number = 10,
  ): Promise<RecipientFoodItem[]> {
    const distributions = await prisma.distribution.findMany({
      where: { recipientID: userID },
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        disID: true,
        quantity: true,
        status: true,
        timestamp: true,
        food: { select: { foodName: true } },
        location: { select: { barangay: true } },
        feedbacks: {
          where: { recipientID: userID },
          take: 1,
          select: { ratingScore: true, comments: true },
        },
      },
    });

    return distributions.map((d) => {
      const myFeedback = d.feedbacks[0];
      const isCompleted = d.status === "COMPLETED";
      const hasFeedback = !!myFeedback;

      return {
        disID: d.disID,
        foodName: d.food.foodName,
        quantity: d.quantity,
        status: d.status.toLowerCase(),
        location: safeDecrypt(d.location.barangay),
        timestamp: d.timestamp,
        canGiveFeedback: isCompleted && !hasFeedback,
        myRating: myFeedback?.ratingScore ?? null,
        myComment: myFeedback?.comments ?? null,
      };
    });
  },

  /**
   * Get all available foods for browsing (recipient browse food feature)
   */
  async getAvailableFoods(limit: number = 20): Promise<AvailableFoodItem[]> {
    const distributions = await prisma.distribution.findMany({
      where: {
        status: "PENDING",
        recipientID: null, // Only show unclaimed items
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        disID: true,
        quantity: true,
        scheduledTime: true,
        timestamp: true,
        food: { select: { foodName: true, description: true, image: true } },
        location: { select: { barangay: true, streetAddress: true } },
        donor: {
          select: {
            firstName: true,
            lastName: true,
            orgName: true,
            isOrg: true,
          },
        },
      },
    });

    return distributions.map((d) => ({
      disID: d.disID,
      foodName: d.food.foodName,
      quantity: d.quantity,
      description: d.food.description,
      image: d.food.image,
      location: safeDecrypt(d.location.barangay),
      streetAddress: safeDecrypt(d.location.streetAddress),
      donorName: d.donor.isOrg
        ? safeDecrypt(d.donor.orgName ?? "Organization")
        : `${safeDecrypt(d.donor.firstName)} ${safeDecrypt(d.donor.lastName)}`,
      scheduledTime: d.scheduledTime,
      timestamp: d.timestamp,
    }));
  },
};
