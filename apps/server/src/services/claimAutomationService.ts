import { prisma } from "@kusinakonek/database";
import { safeDecrypt } from "../utils/encryption";
import { notificationService } from "./notificationService";
import { emailNotificationService } from "./emailNotificationService";

const CLAIM_TO_ON_THE_WAY_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours
const CLAIM_WARNING_BEFORE_BAN_MS = 3 * 60 * 60 * 1000; // 3 hours (1 hour before ban)
const BAN_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const ON_THE_WAY_TO_RECEIVE_REMINDER_MS = 60 * 60 * 1000; // 1 hour
const AUTO_RECEIVE_AFTER_REMINDER_MS = 30 * 60 * 1000; // 30 minutes
const FEEDBACK_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Policy starts on 2026-04-02 00:00:00 Asia/Manila (UTC+8 => 2026-04-01T16:00:00.000Z)
const DEFAULT_POLICY_START_UTC = "2026-04-01T16:00:00.000Z";
const parsedPolicyStart = new Date(
  process.env.CLAIM_POLICY_START_AT || DEFAULT_POLICY_START_UTC,
);
const POLICY_START_UTC = Number.isNaN(parsedPolicyStart.getTime())
  ? new Date(DEFAULT_POLICY_START_UTC)
  : parsedPolicyStart;

export const CLAIM_BAN_NOTIFICATION_TYPE = "CLAIM_BAN";
export const RECEIVE_REQUIRED_BOT_PREFIX = "[KusinaKonek Bot][RECEIVE_REQUIRED]";
export const ON_THE_WAY_STARTED_INTERNAL_PREFIX = "[KusinaKonek Internal][ON_THE_WAY_STARTED]";
const FEEDBACK_REMINDER_BOT_PREFIX = "[KusinaKonek Bot][FEEDBACK_REMINDER]";

const getFullName = (firstName?: string | null, lastName?: string | null) => {
  const fullName = [safeDecrypt(firstName || ""), safeDecrypt(lastName || "")]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Recipient";
};

const getFoodName = (encryptedFoodName?: string | null) => {
  return safeDecrypt(encryptedFoodName || "").trim() || "your claimed food";
};

export const getActiveClaimBan = async (userID: string) => {
  const latestBan = await prisma.notification.findFirst({
    where: {
      userID,
      type: CLAIM_BAN_NOTIFICATION_TYPE,
      createdAt: { gte: POLICY_START_UTC },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!latestBan) {
    return null;
  }

  const bannedUntil = new Date(latestBan.createdAt.getTime() + BAN_DURATION_MS);
  if (bannedUntil.getTime() <= Date.now()) {
    return null;
  }

  return {
    bannedUntil,
    startedAt: latestBan.createdAt,
    sourceNotificationID: latestBan.notificationID,
  };
};

const processClaimWarningBeforeBan = async () => {
  const warningCutoff = new Date(Date.now() - CLAIM_WARNING_BEFORE_BAN_MS);
  const banCutoff = new Date(Date.now() - CLAIM_TO_ON_THE_WAY_TIMEOUT_MS);

  const nearTimeoutClaims = await prisma.distribution.findMany({
    where: {
      status: "CLAIMED",
      recipientID: { not: null },
      claimedAt: {
        gte: POLICY_START_UTC,
        lte: warningCutoff,
        gt: banCutoff,
      },
    },
    include: {
      food: {
        select: {
          foodName: true,
        },
      },
      recipient: {
        select: {
          userID: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (nearTimeoutClaims.length === 0) return;

  for (const dist of nearTimeoutClaims) {
    if (!dist.recipientID) continue;

    const alreadyWarned = await prisma.notification.findFirst({
      where: {
        userID: dist.recipientID,
        type: "CLAIM_TIMEOUT_WARNING",
        entityID: dist.disID,
      },
      select: {
        notificationID: true,
      },
    });

    if (alreadyWarned) continue;

    const foodName = getFoodName(dist.food?.foodName);

    try {
      await prisma.message.create({
        data: {
          disID: dist.disID,
          senderID: dist.donorID,
          messageType: "TEXT",
          content: `[KusinaKonek Bot] 1 hour left: tap I'm on my way for ${foodName} now to avoid a 3-day claim restriction.`,
        },
      });

      await notificationService
        .notifyUser(
          dist.recipientID,
          "1 hour before claim restriction",
          `Tap I'm on my way for ${foodName} within 1 hour to avoid a 3-day claim restriction.`,
          "CLAIM_TIMEOUT_WARNING",
          { screen: "RecipientHome", disID: dist.disID },
          dist.disID,
        )
        .catch((error) => {
          console.error("[ClaimAutomation] Failed to notify claim timeout warning:", error);
        });

      if (dist.recipient?.email) {
        await emailNotificationService.sendClaimTimeoutWarningEmail({
          encryptedEmail: dist.recipient.email,
          encryptedFirstName: dist.recipient.firstName,
          encryptedLastName: dist.recipient.lastName,
          foodName,
        });
      }
    } catch (error) {
      console.error(`[ClaimAutomation] Failed to send timeout warning for ${dist.disID}:`, error);
    }
  }
};

const processClaimTimeoutsAndBan = async () => {
  const claimCutoff = new Date(Date.now() - CLAIM_TO_ON_THE_WAY_TIMEOUT_MS);

  const staleClaims = await prisma.distribution.findMany({
    where: {
      status: "CLAIMED",
      recipientID: { not: null },
      claimedAt: {
        gte: POLICY_START_UTC,
        lte: claimCutoff,
      },
    },
    include: {
      food: {
        select: {
          foodName: true,
        },
      },
      donor: {
        select: {
          userID: true,
          firstName: true,
          lastName: true,
          orgName: true,
          isOrg: true,
        },
      },
      recipient: {
        select: {
          userID: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (staleClaims.length === 0) return;

  console.log(`[ClaimAutomation] Cancelling ${staleClaims.length} stale CLAIMED distribution(s)`);

  for (const dist of staleClaims) {
    if (!dist.recipientID || !dist.recipient) continue;

    const foodName = getFoodName(dist.food?.foodName);
    const recipientName = getFullName(dist.recipient.firstName, dist.recipient.lastName);
    const donorName = dist.donor?.isOrg
      ? safeDecrypt(dist.donor.orgName || "").trim() || "The donor"
      : getFullName(dist.donor?.firstName, dist.donor?.lastName);
    const bannedUntil = new Date(Date.now() + BAN_DURATION_MS);

    try {
      await prisma.distribution.update({
        where: { disID: dist.disID },
        data: {
          status: "PENDING",
          recipientID: null,
          claimedAt: null,
        },
      });

      await prisma.message.create({
        data: {
          disID: dist.disID,
          senderID: dist.donorID,
          messageType: "TEXT",
          content: `[KusinaKonek Bot] Your claim for ${foodName} was cancelled because it stayed in CLAIMED status for more than 4 hours. You are temporarily restricted from claiming food for 3 days.`,
        },
      });

      await notificationService
        .notifyUser(
          dist.recipientID,
          "Claim cancelled: 3-day restriction active",
          `Your claim for ${foodName} was cancelled after 4 hours. You cannot claim new food for 3 days.`,
          CLAIM_BAN_NOTIFICATION_TYPE,
          { screen: "RecipientHome", disID: dist.disID },
          dist.disID,
        )
        .catch((error) => {
          console.error("[ClaimAutomation] Failed to notify recipient ban:", error);
        });

      await notificationService
        .notifyUser(
          dist.donorID,
          "Claim auto-cancelled",
          `${recipientName} did not tap I'm on my way within 4 hours. ${foodName} is available again.`,
          "CLAIM_TIMEOUT",
          { screen: "DonorHome", disID: dist.disID },
          dist.disID,
        )
        .catch((error) => {
          console.error("[ClaimAutomation] Failed to notify donor timeout:", error);
        });

      await emailNotificationService.sendClaimBanEmail({
        encryptedEmail: dist.recipient.email,
        encryptedFirstName: dist.recipient.firstName,
        encryptedLastName: dist.recipient.lastName,
        foodName,
        bannedUntil,
      });

      console.log(
        `[ClaimAutomation] Claim timed out for ${recipientName}; applied 3-day restriction and re-opened distribution ${dist.disID}.`,
      );
      console.log(`[ClaimAutomation] Notification context: donor=${donorName}, food=${foodName}`);
    } catch (error) {
      console.error(`[ClaimAutomation] Failed handling timed-out claim ${dist.disID}:`, error);
    }
  }
};

const processOnTheWayAutoReceive = async () => {
  const reminderReadyCutoff = new Date(Date.now() - ON_THE_WAY_TO_RECEIVE_REMINDER_MS);
  const reminderCutoff = new Date(Date.now() - AUTO_RECEIVE_AFTER_REMINDER_MS);

  const onTheWayDistributions = await prisma.distribution.findMany({
    where: {
      status: "ON_THE_WAY",
      recipientID: { not: null },
    },
    include: {
      food: {
        select: {
          foodName: true,
        },
      },
      recipient: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  for (const dist of onTheWayDistributions) {
    if (!dist.recipientID) continue;

    const onTheWayMarker = await prisma.message.findFirst({
      where: {
        disID: dist.disID,
        messageType: "TEXT",
        content: {
          startsWith: ON_THE_WAY_STARTED_INTERNAL_PREFIX,
        },
        createdAt: {
          gte: POLICY_START_UTC,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    if (!onTheWayMarker) continue;

    const latestReceiveReminder = await prisma.message.findFirst({
      where: {
        disID: dist.disID,
        messageType: "TEXT",
        content: {
          startsWith: RECEIVE_REQUIRED_BOT_PREFIX,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        messageID: true,
        createdAt: true,
      },
    });

    const foodName = getFoodName(dist.food?.foodName);

    if (!latestReceiveReminder && onTheWayMarker.createdAt <= reminderReadyCutoff) {
      try {
        await prisma.message.create({
          data: {
            disID: dist.disID,
            senderID: dist.donorID,
            messageType: "TEXT",
            content: `${RECEIVE_REQUIRED_BOT_PREFIX} Please tap Receive for ${foodName} within 30 minutes. If no confirmation is submitted, KusinaKonek will automatically mark it as received.`,
          },
        });

        await notificationService
          .notifyUser(
            dist.recipientID,
            "Please confirm receipt",
            `Please tap Receive for ${foodName} within 30 minutes.`,
            "RECEIVE_REQUIRED",
            { screen: "RecipientHome", disID: dist.disID },
            dist.disID,
          )
          .catch((error) => {
            console.error("[ClaimAutomation] Failed to notify receive reminder:", error);
          });

        if (dist.recipient?.email) {
          await emailNotificationService.sendReceiveConfirmationReminderEmail({
            encryptedEmail: dist.recipient.email,
            encryptedFirstName: dist.recipient.firstName,
            encryptedLastName: dist.recipient.lastName,
            foodName,
            autoReceiveInMinutes: AUTO_RECEIVE_AFTER_REMINDER_MS / (60 * 1000),
          });
        }
      } catch (error) {
        console.error(`[ClaimAutomation] Failed to create receive reminder for ${dist.disID}:`, error);
      }

      continue;
    }

    if (!latestReceiveReminder) continue;
    if (latestReceiveReminder.createdAt > reminderCutoff) continue;

    const recipientName = getFullName(dist.recipient?.firstName, dist.recipient?.lastName);

    try {
      await prisma.distribution.update({
        where: { disID: dist.disID },
        data: {
          status: "COMPLETED",
          actualTime: new Date(),
        },
      });

      await prisma.message.create({
        data: {
          disID: dist.disID,
          senderID: dist.donorID,
          messageType: "TEXT",
          content: `[KusinaKonek Bot][AUTO_RECEIVED] We automatically marked ${foodName} as received because there was no confirmation within 30 minutes after the reminder.`,
        },
      });

      await notificationService
        .notifyUser(
          dist.recipientID,
          "Food marked as received",
          `We automatically marked ${foodName} as received. Please leave feedback for the donor.`,
          "AUTO_RECEIVED",
          { screen: "RecipientHome", disID: dist.disID },
          dist.disID,
        )
        .catch((error) => {
          console.error("[ClaimAutomation] Failed to notify recipient auto-receive:", error);
        });

      await notificationService
        .notifyUser(
          dist.donorID,
          "Food delivered",
          `${recipientName}'s claim for ${foodName} was automatically marked as received.`,
          "DELIVERY_CONFIRMED",
          { screen: "DonorHome", disID: dist.disID },
          dist.disID,
        )
        .catch((error) => {
          console.error("[ClaimAutomation] Failed to notify donor auto-receive:", error);
        });

      console.log(`[ClaimAutomation] Auto-received distribution ${dist.disID} after 30-minute reminder window.`);
    } catch (error) {
      console.error(`[ClaimAutomation] Failed auto-receive for ${dist.disID}:`, error);
    }
  }
};

const processDailyFeedbackReminders = async () => {
  const reminderCutoff = new Date(Date.now() - FEEDBACK_REMINDER_INTERVAL_MS);

  const completedDistributions = await prisma.distribution.findMany({
    where: {
      status: "COMPLETED",
      recipientID: { not: null },
      actualTime: { gte: POLICY_START_UTC },
    },
    include: {
      food: {
        select: {
          foodName: true,
        },
      },
      recipient: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  for (const dist of completedDistributions) {
    if (!dist.recipientID) continue;

    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        disID: dist.disID,
        recipientID: dist.recipientID,
      },
      select: {
        feedbackID: true,
      },
    });

    if (existingFeedback) continue;

    const latestReminder = await prisma.message.findFirst({
      where: {
        disID: dist.disID,
        messageType: "TEXT",
        content: {
          startsWith: FEEDBACK_REMINDER_BOT_PREFIX,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    if (latestReminder && latestReminder.createdAt > reminderCutoff) {
      continue;
    }

    const foodName = getFoodName(dist.food?.foodName);

    try {
      await prisma.message.create({
        data: {
          disID: dist.disID,
          senderID: dist.donorID,
          messageType: "TEXT",
          content: `${FEEDBACK_REMINDER_BOT_PREFIX} Please leave a rating and feedback for ${foodName}. This reminder stops once you submit your feedback.`,
        },
      });

      await notificationService
        .notifyUser(
          dist.recipientID,
          "Please rate your donor",
          `Kindly leave your rating/feedback for ${foodName}. We will remind you daily until feedback is submitted.`,
          "FEEDBACK_REMINDER",
          { screen: "RecipientHome", disID: dist.disID },
          dist.disID,
        )
        .catch((error) => {
          console.error("[ClaimAutomation] Failed to notify feedback reminder:", error);
        });

      if (dist.recipient?.email) {
        await emailNotificationService.sendFeedbackReminderEmail({
          encryptedEmail: dist.recipient.email,
          encryptedFirstName: dist.recipient.firstName,
          encryptedLastName: dist.recipient.lastName,
          foodName,
        });
      }

      console.log(`[ClaimAutomation] Sent feedback reminder for completed distribution ${dist.disID}.`);
    } catch (error) {
      console.error(`[ClaimAutomation] Failed sending feedback reminder for ${dist.disID}:`, error);
    }
  }
};

const runClaimAutomationCycle = async () => {
  await processClaimWarningBeforeBan();
  await processClaimTimeoutsAndBan();
  await processOnTheWayAutoReceive();
  await processDailyFeedbackReminders();
};

export function startClaimAutomationScheduler() {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  let isRunning = false;

  const runCycleSafely = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      await runClaimAutomationCycle();
    } catch (error) {
      console.error("[ClaimAutomation] Scheduler cycle failed:", error);
    } finally {
      isRunning = false;
    }
  };

  setInterval(() => {
    runCycleSafely().catch((error) => {
      console.error("[ClaimAutomation] Unhandled scheduler error:", error);
    });
  }, INTERVAL_MS);

  runCycleSafely().catch((error) => {
    console.error("[ClaimAutomation] Startup cycle failed:", error);
  });

  console.log(`[ClaimAutomation] Policy start: ${POLICY_START_UTC.toISOString()}`);
  console.log("[ClaimAutomation] Scheduler started (checks every 5 min)");
}
