import { prisma } from "@kusinakonek/database";
import { safeDecrypt } from "../utils/encryption";

// ============================================================
// Type Definitions
// ============================================================

export interface DonorStats {
  totalDonated: number;
  availableItems: number;
  averageRating: number;
  familiesHelped: number;
  unreadNotifications: number;
}

export interface RecipientStats {
  availableFoods: number;
  locations: number;
  totalServings: number;
  totalReceived: number;
  activeNow: number;
  unreadNotifications: number;
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
    const [totalDonated, availableItems, avgRating, familiesHelped, unreadNotifications] = await Promise.all([
      // Count distributions that have been claimed/on-the-way/completed
      prisma.distribution.count({
        where: {
          donorID: userID,
          status: { in: ["CLAIMED", "ON_THE_WAY", "COMPLETED"] },
        },
      }),

      // Count distributions still available (PENDING)
      prisma.distribution.count({
        where: {
          donorID: userID,
          status: "PENDING",
        },
      }),

      // Calculate average rating from feedback received
      prisma.feedback.aggregate({
        where: { donorID: userID },
        _avg: { ratingScore: true },
      }),

      // Count distinct recipients (families helped)
      prisma.distribution.findMany({
        where: {
          donorID: userID,
          recipientID: { not: null },
        },
        select: { recipientID: true },
        distinct: ["recipientID"],
      }),

      // Count unread notifications
      prisma.notification.count({
        where: {
          userID,
          isRead: false,
        },
      }),
    ]);

    return {
      totalDonated,
      availableItems,
      averageRating: Math.round((avgRating._avg.ratingScore ?? 0) * 10) / 10,
      familiesHelped: familiesHelped.length,
      unreadNotifications,
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
        foodName: safeDecrypt(d.food.foodName),
        quantity: d.quantity,
        status: d.status.toLowerCase(),
        location: safeDecrypt(d.location.barangay),
        timestamp: d.timestamp,
        claimedBy: d.recipient
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
    // quantity is a String field, so we can't use _sum in aggregate.
    // Fetch counts + quantities separately.
    const [availableCount, locationCount, quantities, unreadNotifications] = await Promise.all([
      prisma.distribution.count({
        where: {
          status: "PENDING",
          recipientID: null,
        },
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
      prisma.distribution.findMany({
        where: {
          status: "PENDING",
          recipientID: null,
        },
        select: { quantity: true },
      }),
      prisma.notification.count({
        where: {
          userID,
          isRead: false,
        },
      }),
    ]);

    // Parse and sum quantity strings manually
    const totalServings = quantities.reduce((sum, d) => {
      const parsed = parseInt(String(d.quantity), 10);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);

    // Count completed distributions for this recipient (food received)
    const totalReceived = await prisma.distribution.count({
      where: {
        recipientID: userID,
        status: "COMPLETED",
      },
    });

    // Count active distributions for this recipient (claimed / on the way)
    const activeNow = await prisma.distribution.count({
      where: {
        recipientID: userID,
        status: { in: ["CLAIMED", "ON_THE_WAY"] },
      },
    });

    return {
      availableFoods: availableCount,
      locations: locationCount,
      totalServings,
      totalReceived,
      activeNow,
      unreadNotifications,
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
      orderBy: { claimedAt: "desc" },
      take: limit,
      select: {
        disID: true,
        quantity: true,
        status: true,
        timestamp: true,
        claimedAt: true,
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
        foodName: safeDecrypt(d.food.foodName),
        quantity: d.quantity,
        status: d.status.toLowerCase(),
        location: safeDecrypt(d.location.barangay),
        timestamp: d.claimedAt || d.timestamp,
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
      foodName: safeDecrypt(d.food.foodName),
      quantity: d.quantity,
      description: d.food.description ? safeDecrypt(d.food.description) : null,
      image: d.food.image ? safeDecrypt(d.food.image) : null,
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
