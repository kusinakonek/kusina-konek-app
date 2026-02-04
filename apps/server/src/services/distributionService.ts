import { CreateDistributionInput, MarkDistributionCompleteInput, Role } from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import { distributionRepository, foodRepository, locationRepository, userRepository } from "../repositories";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Complete your profile first");
  return profile;
};

export const distributionService = {
  async createDistribution(params: {
    donorID: string;
    donorRole?: string;
    input: CreateDistributionInput;
  }) {
    await ensureProfile(params.donorID);

    if ((params.donorRole as Role | undefined) !== "DONOR") {
      throw new HttpError(403, "Only donors can create distributions");
    }

    const recipient = await userRepository.getByUserId(params.input.recipientID);
    if (!recipient) throw new HttpError(404, "Recipient profile not found");

    const location = await locationRepository.getById(params.input.locID);
    if (!location) throw new HttpError(404, "Drop-off location not found");

    const food = await foodRepository.getById(params.input.foodID);
    if (!food) throw new HttpError(404, "Food not found");
    if (food.userID !== params.donorID) throw new HttpError(403, "Food does not belong to donor");

    const distribution = await distributionRepository.create({
      donor: { connect: { userID: params.donorID } },
      recipient: { connect: { userID: params.input.recipientID } },
      location: { connect: { locID: params.input.locID } },
      food: { connect: { foodID: params.input.foodID } },
      quantity: params.input.quantity,
      scheduledTime: new Date(params.input.scheduledTime),
      photoProof: params.input.photoProof
    });

    return { distribution };
  },

  async listMyDistributions(userID: string) {
    await ensureProfile(userID);
    const distributions = await distributionRepository.listForUser(userID);
    return { distributions };
  },

  async completeDistribution(params: {
    userID: string;
    disID: string;
    input: MarkDistributionCompleteInput;
  }) {
    await ensureProfile(params.userID);

    const existing = await distributionRepository.getById(params.disID);
    if (!existing) throw new HttpError(404, "Distribution not found");

    // Allow either donor or recipient to mark as completed (sets actualTime)
    if (existing.donorID !== params.userID && existing.recipientID !== params.userID) {
      throw new HttpError(403, "Forbidden");
    }

    const updated = await distributionRepository.update(params.disID, {
      actualTime: params.input.actualTime ? new Date(params.input.actualTime) : new Date()
    });

    return { distribution: updated };
  }
};
