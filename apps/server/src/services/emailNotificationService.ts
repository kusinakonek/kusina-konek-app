import nodemailer from "nodemailer";
import { safeDecrypt } from "../utils/encryption";

let transporter: nodemailer.Transporter | null = null;
let attemptedInit = false;

const getTransporter = () => {
  if (attemptedInit) return transporter;

  attemptedInit = true;
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailAppPassword) {
    console.warn(
      "[EmailNotification] GMAIL_USER / GMAIL_APP_PASSWORD not configured. Email notifications are disabled.",
    );
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  return transporter;
};

const formatPhilippineDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(date);
};

const getRecipientName = (firstName?: string | null, lastName?: string | null) => {
  const first = safeDecrypt(firstName || "").trim();
  const last = safeDecrypt(lastName || "").trim();
  return `${first} ${last}`.trim() || "Recipient";
};

const getRecipientEmail = (encryptedEmail: string) => {
  return safeDecrypt(encryptedEmail).trim();
};

const sendEmail = async (params: {
  toEncryptedEmail: string;
  subject: string;
  text: string;
  logContext: string;
}) => {
  const smtp = getTransporter();
  if (!smtp) return;

  const toEmail = getRecipientEmail(params.toEncryptedEmail);
  if (!toEmail) {
    console.warn(`[EmailNotification] Cannot send ${params.logContext}: recipient email is empty`);
    return;
  }

  try {
    await smtp.sendMail({
      from: `\"KusinaKonek\" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: params.subject,
      text: params.text,
    });
  } catch (error) {
    console.error(`[EmailNotification] Failed to send ${params.logContext}:`, error);
  }
};

export const emailNotificationService = {
  async sendClaimBanEmail(params: {
    encryptedEmail: string;
    encryptedFirstName?: string | null;
    encryptedLastName?: string | null;
    foodName: string;
    bannedUntil: Date;
  }) {
    const recipientName = getRecipientName(
      params.encryptedFirstName,
      params.encryptedLastName,
    );
    const untilText = formatPhilippineDateTime(params.bannedUntil);

    const subject = "KusinaKonek: 3-day claim restriction notice";
    const text = [
      `Hello ${recipientName},`,
      "",
      `Your claim for "${params.foodName}" was cancelled because it remained in CLAIMED status for over 4 hours without being marked as "I'm on my way".`,
      "",
      `A temporary claim restriction is now active until ${untilText} (Philippine time).`,
      "",
      "During this period, you cannot claim new food donations. Once the restriction ends, you can claim again normally.",
      "",
      "Thank you for understanding,",
      "KusinaKonek Team",
    ].join("\n");

    await sendEmail({
      toEncryptedEmail: params.encryptedEmail,
      subject,
      text,
      logContext: "claim-ban email",
    });
  },

  async sendClaimTimeoutWarningEmail(params: {
    encryptedEmail: string;
    encryptedFirstName?: string | null;
    encryptedLastName?: string | null;
    foodName: string;
  }) {
    const recipientName = getRecipientName(
      params.encryptedFirstName,
      params.encryptedLastName,
    );

    const subject = "KusinaKonek: 1-hour warning before claim restriction";
    const text = [
      `Hello ${recipientName},`,
      "",
      `Your claim for "${params.foodName}" will be cancelled in 1 hour if you do not tap "I'm on my way".`,
      "",
      "Please update your pickup status to avoid a 3-day claim restriction.",
      "",
      "KusinaKonek Team",
    ].join("\n");

    await sendEmail({
      toEncryptedEmail: params.encryptedEmail,
      subject,
      text,
      logContext: "claim-timeout warning email",
    });
  },

  async sendReceiveConfirmationReminderEmail(params: {
    encryptedEmail: string;
    encryptedFirstName?: string | null;
    encryptedLastName?: string | null;
    foodName: string;
    autoReceiveInMinutes: number;
  }) {
    const recipientName = getRecipientName(
      params.encryptedFirstName,
      params.encryptedLastName,
    );

    const subject = "KusinaKonek: Please confirm your food receipt";
    const text = [
      `Hello ${recipientName},`,
      "",
      `Please tap the Receive button for "${params.foodName}".`,
      "",
      `If you do not confirm within ${params.autoReceiveInMinutes} minutes, KusinaKonek will automatically mark this claim as received.`,
      "",
      "KusinaKonek Team",
    ].join("\n");

    await sendEmail({
      toEncryptedEmail: params.encryptedEmail,
      subject,
      text,
      logContext: "receive-confirmation reminder email",
    });
  },

  async sendFeedbackReminderEmail(params: {
    encryptedEmail: string;
    encryptedFirstName?: string | null;
    encryptedLastName?: string | null;
    foodName: string;
  }) {
    const recipientName = getRecipientName(
      params.encryptedFirstName,
      params.encryptedLastName,
    );

    const subject = "KusinaKonek: Please submit your feedback";
    const text = [
      `Hello ${recipientName},`,
      "",
      `Please leave your rating and feedback for "${params.foodName}".`,
      "",
      "We will continue sending reminders daily until feedback is submitted.",
      "",
      "KusinaKonek Team",
    ].join("\n");

    await sendEmail({
      toEncryptedEmail: params.encryptedEmail,
      subject,
      text,
      logContext: "feedback reminder email",
    });
  },
};
