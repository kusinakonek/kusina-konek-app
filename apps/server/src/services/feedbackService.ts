import { CreateFeedbackInput } from "@kusinakonek/common";
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

    if (distribution.donorID !== params.userID && distribution.recipientID !== params.userID) {
      throw new HttpError(403, "Forbidden");
    }

    // Schema does not record author; we only ensure the user participated in the distribution.
    const feedback = await feedbackRepository.create({
      distribution: { connect: { disID: params.input.disID } },
      donor: { connect: { userID: distribution.donorID } },
      recipient: { connect: { userID: distribution.recipientID } },
      ratingScore: params.input.ratingScore,
      comments: params.input.comments
    });

    return { feedback };
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
  }
};
