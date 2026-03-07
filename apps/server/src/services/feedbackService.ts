import { CreateFeedbackInput, UpdateFeedbackInput } from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import { distributionRepository, feedbackRepository, userRepository } from "../repositories";
import { sha256Hex } from "../utils/hash";
import { safeDecrypt } from "../utils/encryption";

const ensureProfile = async (email: string) => {
  const emailHash = sha256Hex(email.toLowerCase());
  const profile = await userRepository.getByEmailHash(emailHash);
  if (!profile) throw new HttpError(400, "Please complete your profile first. Go to Profile > Edit Profile.");
  return profile;
};

export const feedbackService = {
  async createFeedback(params: { email: string; input: CreateFeedbackInput }) {
    const profile = await ensureProfile(params.email);
    const userID = profile.userID;

    const distribution = await distributionRepository.getById(params.input.disID);
    if (!distribution) throw new HttpError(404, "Distribution not found");

    // Only Recipient can post feedback (as per requirements)
    if (distribution.recipientID !== userID) {
      throw new HttpError(403, "Only the recipient can post feedback");
    }

    const feedback = await feedbackRepository.create({
      distribution: { connect: { disID: params.input.disID } },
      donor: { connect: { userID: distribution.donorID } },
      recipient: { connect: { userID: distribution.recipientID } },
      ratingScore: params.input.ratingScore,
      comments: params.input.comments,
      photoUrl: params.input.photoUrl
    });

    // --- Recalculate Donor's Average Rating ---
    const donorID = distribution.donorID;

    // Get all ratings for this donor
    const aggregations = await feedbackRepository.listReceived(donorID);
    const totalRating = aggregations.reduce((acc, curr) => acc + curr.ratingScore, 0);
    const count = aggregations.length;
    const newAverage = count > 0 ? totalRating / count : 0;

    // Update User table
    await userRepository.update(donorID, {
      averageRating: newAverage,
      ratingCount: count
    });

    // Notify Donor about the new feedback
    try {
      await import("./notificationService").then(ns =>
        ns.notificationService.notifyUser(
          donorID,
          "New Feedback Received!",
          `A recipient has left a ${params.input.ratingScore}-star review on your donation.`,
          "FEEDBACK",
          { screen: "Feedback", disID: distribution.disID },
          feedback.feedbackID
        )
      );
    } catch (error) {
      console.error("Failed to send feedback notification to donor", error);
    }

    return { feedback };
  },

  async updateFeedback(params: { email: string; feedbackID: string; input: UpdateFeedbackInput }) {
    const profile = await ensureProfile(params.email);
    const userID = profile.userID;

    const feedback = await feedbackRepository.getById(params.feedbackID);
    if (!feedback) throw new HttpError(404, "Feedback not found");

    // Only Recipient (who created it) can edit it.
    if (feedback.recipientID !== userID) {
      throw new HttpError(403, "Only the author (recipient) can edit this feedback");
    }

    const updatedFeedback = await feedbackRepository.update(params.feedbackID, {
      ratingScore: params.input.ratingScore,
      comments: params.input.comments
    });

    return { feedback: updatedFeedback };
  },

  async listForDistribution(params: { email: string; disID: string }) {
    const profile = await ensureProfile(params.email);
    const userID = profile.userID;

    const distribution = await distributionRepository.getById(params.disID);
    if (!distribution) throw new HttpError(404, "Distribution not found");

    if (distribution.donorID !== userID && distribution.recipientID !== userID) {
      throw new HttpError(403, "Forbidden");
    }

    const feedbacks = await feedbackRepository.listForDistribution(params.disID);

    // Decrypt fields
    const decryptedFeedbacks = feedbacks.map(f => {
      // Create a deep copy or modify 
      // We need to type cast or just let TS infer if we are returning simpler objects
      // But preserving the structure is best.
      // Note: We are modifying nested objects.

      const d = f.distribution;
      if (d) {
        if (d.food) d.food.foodName = safeDecrypt(d.food.foodName);
        if (d.location) {
          d.location.barangay = safeDecrypt(d.location.barangay);
          d.location.streetAddress = safeDecrypt(d.location.streetAddress);
        }
        // Recipient details might be in d.recipient or f.recipient
      }

      // The feedback repository "defaultInclude" has recipient: { include: { role: true } }
      // So f.recipient is the user object of the author (recipient)
      if (f.recipient) {
        f.recipient.firstName = safeDecrypt(f.recipient.firstName);
        f.recipient.lastName = safeDecrypt(f.recipient.lastName);
      }

      return f;
    });

    return { feedbacks: decryptedFeedbacks };
  },

  async listReceivedFeedbacks(email: string) {
    const profile = await ensureProfile(email);
    const feedbacks = await feedbackRepository.listReceived(profile.userID);

    // Decrypt fields
    const decryptedFeedbacks = feedbacks.map(f => {
      const d = f.distribution;
      if (d) {
        if (d.food) d.food.foodName = safeDecrypt(d.food.foodName);
        if (d.location) {
          d.location.barangay = safeDecrypt(d.location.barangay);
          d.location.streetAddress = safeDecrypt(d.location.streetAddress);
        }

      }

      // f.recipient is the author of the feedback (the recipient user)
      if (f.recipient) {
        f.recipient.firstName = safeDecrypt(f.recipient.firstName);
        f.recipient.lastName = safeDecrypt(f.recipient.lastName);
      }

      return f;
    });

    return { feedbacks: decryptedFeedbacks };
  }
};
