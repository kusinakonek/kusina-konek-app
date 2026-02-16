import { CreateFeedbackInput, UpdateFeedbackInput } from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import { distributionRepository, feedbackRepository, userRepository } from "../repositories";
import { sha256Hex } from "../utils/hash";

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
      comments: params.input.comments
    });

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
    return { feedbacks };
  },

  async listReceivedFeedbacks(email: string) {
    const profile = await ensureProfile(email);
    const feedbacks = await feedbackRepository.listReceived(profile.userID);
    return { feedbacks };
  }
};

