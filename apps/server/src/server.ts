import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "@kusinakonek/database";
import { notificationService } from "./services/notificationService";
import { scheduleAutoRevert } from "./services/cronService";
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

  app.listen(env.PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://0.0.0.0:${env.PORT}`);
    console.log(`Access from other devices using your machine's IP address`);
  });
};

start();
