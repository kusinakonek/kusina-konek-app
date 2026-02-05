import { CreateFeedbackInput, UpdateFeedbackInput } from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import { distributionRepository, feedbackRepository, userRepository } from "../repositories";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Complete your profile first");
  return profile;
};

export const feedbackService = {
  async createFeedback(params: { userID: string; input: CreateFeedbackInput }) {
    await ensureProfile(params.userID);

    const distribution = await distributionRepository.getById(params.input.disID);
    if (!distribution) throw new HttpError(404, "Distribution not found");

    // Only Recipient can post feedback (as per requirements)
    if (distribution.recipientID !== params.userID) {
      throw new HttpError(403, "Only the recipient can post feedback");
    }

    // Check if feedback already exists for this distribution? The schema doesn't enforce 1:1 explicitly but "post a feedback" implies one.
    // The current schema allows many feedbacks per distribution. 
    // Assuming one feedback per distribution is the goal or at least allowing it.
    // Let's stick strictly to "recipient will post".

    const feedback = await feedbackRepository.create({
      distribution: { connect: { disID: params.input.disID } },
      donor: { connect: { userID: distribution.donorID } },
      recipient: { connect: { userID: distribution.recipientID } },
      ratingScore: params.input.ratingScore,
      comments: params.input.comments
    });

    return { feedback };
  },

  async updateFeedback(params: { userID: string; feedbackID: string; input: UpdateFeedbackInput }) {
    await ensureProfile(params.userID);

    const feedback = await feedbackRepository.getById(params.feedbackID);
    if (!feedback) throw new HttpError(404, "Feedback not found");

    // Only Recipient (who created it) can edit it.
    // The schema tracks recipientID on the feedback.
    if (feedback.recipientID !== params.userID) {
      throw new HttpError(403, "Only the author (recipient) can edit this feedback");
    }

    const updatedFeedback = await feedbackRepository.update(params.feedbackID, {
      ratingScore: params.input.ratingScore,
      comments: params.input.comments
    });

    return { feedback: updatedFeedback };
  },

  async listForDistribution(params: { userID: string; disID: string }) {
    await ensureProfile(params.userID);

    const distribution = await distributionRepository.getById(params.disID);
    if (!distribution) throw new HttpError(404, "Distribution not found");

    if (distribution.donorID !== params.userID && distribution.recipientID !== params.userID) {
      throw new HttpError(403, "Forbidden");
    }

    const feedbacks = await feedbackRepository.listForDistribution(params.disID);
    return { feedbacks };
  },

  async listReceivedFeedbacks(userID: string) {
    await ensureProfile(userID);
    const feedbacks = await feedbackRepository.listReceived(userID);
    return { feedbacks };
  }
};
