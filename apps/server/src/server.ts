import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "@kusinakonek/database";
import { notificationService } from "./services/notificationService";

import dns from "node:dns";

// Force IPv4 to avoid Supabase connection timeouts (ConnectTimeoutError)
// caused by node preferring IPv6 on networks where it's unstable
dns.setDefaultResultOrder("ipv4first");

const PORT = env.PORT || 3000;

/**
 * Auto-revert scheduler: every 15 minutes, check for distributions that have been
 * in ON_THE_WAY status for more than 3 hours without being confirmed.
 * These get reverted to PENDING so other recipients can claim the food.
 */
function startAutoRevertScheduler() {
  const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  const TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours

  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - TIMEOUT_MS);

      // Find distributions that have been ON_THE_WAY for over 3 hours
      const expired = await prisma.distribution.findMany({
        where: {
          status: "ON_THE_WAY",
          claimedAt: { lt: cutoff },
        },
        select: { disID: true, recipientID: true, donorID: true },
      });

      if (expired.length === 0) return;

      console.log(`[AutoRevert] Reverting ${expired.length} expired distribution(s) to PENDING`);

      for (const dist of expired) {
        // Reset to PENDING and clear recipient
        await prisma.distribution.update({
          where: { disID: dist.disID },
          data: {
            status: "PENDING",
            recipientID: null,
            claimedAt: null,
          },
        });

        // Notify the recipient that time expired
        if (dist.recipientID) {
          notificationService
            .notifyUser(
              dist.recipientID,
              "⏰ Pickup time expired",
              "You didn't pick up the food in time. It's now available for others.",
              "PICKUP_EXPIRED",
              {},
              dist.disID,
            )
            .catch((e) => console.error("Notify error:", e));
        }
      }
    } catch (error) {
      console.error("[AutoRevert] Error during auto-revert check:", error);
    }
  }, INTERVAL_MS);

  console.log("[AutoRevert] 3-hour pickup timeout scheduler started (checks every 15 min)");
}

/**
 * Inactivity scheduler: every 24 hours, check for users whose last login
 * was more than 30 days ago, and mark their accounts as inactive.
 */
function startInactivityScheduler() {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  setInterval(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.user.updateMany({
        where: {
          lastLoginAt: { lt: thirtyDaysAgo },
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      if (result.count > 0) {
        console.log(`[Inactivity] Deactivated ${result.count} dormant account(s).`);
      }
    } catch (error) {
      console.error("[Inactivity] Error during inactivity check:", error);
    }
  }, INTERVAL_MS);

  // Run it once immediately on startup as well
  (async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = await prisma.user.updateMany({
        where: { lastLoginAt: { lt: thirtyDaysAgo }, isActive: true },
        data: { isActive: false }
      });
      if (result.count > 0) {
        console.log(`[Inactivity] Initial check deactivated ${result.count} dormant account(s).`);
      }
    } catch (e) {
      console.error("[Inactivity] Startup check failed:", e);
    }
  })();

  console.log("[Inactivity] Inactivity scheduler started (checks every 24 hours)");
}

/**
 * Food expiry scheduler: every 5 minutes, check for PENDING food donations
 * whose availability duration has elapsed without being claimed.
 * Auto-cancels them and notifies the donor via Firebase push notification.
 * All time comparisons use Philippine time (Asia/Manila, UTC+8).
 */
function startFoodExpiryScheduler() {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  setInterval(async () => {
    try {
      // Current time in PH timezone (UTC+8)
      const nowPH = new Date(Date.now() + 8 * 60 * 60 * 1000);

      // Find all PENDING distributions with their food data
      const pendingDistributions = await prisma.distribution.findMany({
        where: {
          status: "PENDING",
          recipientID: null,
        },
        include: {
          food: true,
          donor: {
            select: {
              userID: true,
              firstName: true,
              lastName: true,
              pushToken: true,
            },
          },
        },
      });

      if (pendingDistributions.length === 0) return;

      const expiredDistributions = pendingDistributions.filter((dist) => {
        const food = dist.food as any;
        const durationMinutes = food.availabilityDuration ?? 240; // default 4 hours
        const foodTimestamp = new Date(food.timestamp);
        // Convert food timestamp to PH time for comparison
        const foodTimePH = new Date(foodTimestamp.getTime() + 8 * 60 * 60 * 1000);
        const expiryTimePH = new Date(foodTimePH.getTime() + durationMinutes * 60 * 1000);
        return nowPH >= expiryTimePH;
      });

      if (expiredDistributions.length === 0) return;

      console.log(`[FoodExpiry] Found ${expiredDistributions.length} expired donation(s) to cancel`);

      for (const dist of expiredDistributions) {
        try {
          // Delete distribution first (foreign key constraint)
          await prisma.distribution.delete({
            where: { disID: dist.disID },
          });

          // Check if food has any other distributions; if not, delete the food too
          const otherDist = await prisma.distribution.findFirst({
            where: { foodID: dist.food.foodID },
          });

          if (!otherDist) {
            // Delete locations first
            await prisma.dropOffLocation.deleteMany({
              where: { foodID: dist.food.foodID },
            });
            await prisma.food.delete({
              where: { foodID: dist.food.foodID },
            });
          }

          // Notify the donor
          const foodName = dist.food.foodName || "Food donation";
          await notificationService.notifyUser(
            dist.donor.userID,
            "⏰ Food Expired",
            `Your food "${foodName}" was not claimed and has expired. It has been automatically removed.`,
            "FOOD_EXPIRED",
            {},
            dist.disID,
          );

          console.log(`[FoodExpiry] Cancelled "${foodName}" (disID: ${dist.disID}), notified donor ${dist.donor.userID}`);
        } catch (err) {
          console.error(`[FoodExpiry] Error cancelling distribution ${dist.disID}:`, err);
        }
      }
    } catch (error) {
      console.error("[FoodExpiry] Error during food expiry check:", error);
    }
  }, INTERVAL_MS);

  console.log("[FoodExpiry] Food expiry scheduler started (checks every 5 min, PH timezone)");
}

const start = async () => {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log("Database connected (Prisma)");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Database connection failed (Prisma)", error);
  }

  startAutoRevertScheduler();
  startInactivityScheduler();
  startFoodExpiryScheduler();

  app.listen(env.PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://0.0.0.0:${env.PORT}`);
    console.log(`Access from other devices using your machine's IP address`);
  });
};

start();
