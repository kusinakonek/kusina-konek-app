import {
  CreateDistributionInput,
  MarkDistributionCompleteInput,
  UpdateDistributionInput,
  UpdateDistributionStatusInput,
  Role,
} from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import {
  distributionRepository,
  foodRepository,
  locationRepository,
  userRepository,
} from "../repositories";

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

    const recipient = await userRepository.getByUserId(
      params.input.recipientID,
    );
    if (!recipient) throw new HttpError(404, "Recipient profile not found");

    const location = await locationRepository.getById(params.input.locID);
    if (!location) throw new HttpError(404, "Drop-off location not found");

    const food = await foodRepository.getById(params.input.foodID);
    if (!food) throw new HttpError(404, "Food not found");
    if (food.userID !== params.donorID)
      throw new HttpError(403, "Food does not belong to donor");

    const distribution = await distributionRepository.create({
      donor: { connect: { userID: params.donorID } },
      recipient: { connect: { userID: params.input.recipientID } },
      location: { connect: { locID: params.input.locID } },
      food: { connect: { foodID: params.input.foodID } },
      quantity: params.input.quantity,
      scheduledTime: new Date(params.input.scheduledTime),
      photoProof: params.input.photoProof,
    });

    return { distribution };
  },

  async getDistribution(userID: string, disID: string) {
    await ensureProfile(userID);

    const distribution = await distributionRepository.getById(disID);
    if (!distribution) throw new HttpError(404, "Distribution not found");

    return { distribution };
  },

  async getAllDistributions(userID: string) {
    await ensureProfile(userID);

    const distributions = await distributionRepository.getAll();
    return { distributions };
  },

  async listMyDistributions(userID: string) {
    await ensureProfile(userID);
    const distributions = await distributionRepository.listForUser(userID);
    return { distributions };
  },

  async listAvailableDistributions() {
    // No auth required - public endpoint for browsing available distributions
    const distributions = await distributionRepository.listAvailable();
    return { distributions };
  },

  async listDistributionsForRecipient(recipientID: string) {
    // List distributions assigned to a specific recipient
    const distributions = await distributionRepository.listForRecipient(recipientID);
    return { distributions };
  },

  async updateDistribution(params: {
    userID: string;
    disID: string;
    input: UpdateDistributionInput;
  }) {
    await ensureProfile(params.userID);

    const existing = await distributionRepository.getById(params.disID);
    if (!existing) throw new HttpError(404, "Distribution not found");

    // Only donor can update distribution details
    if (existing.donorID !== params.userID) {
      throw new HttpError(
        403,
        "Only the donor can update distribution details",
      );
    }

    const updateData: any = {};

    if (params.input.recipientID) {
      const recipient = await userRepository.getByUserId(
        params.input.recipientID,
      );
      if (!recipient) throw new HttpError(404, "Recipient profile not found");
      updateData.recipient = { connect: { userID: params.input.recipientID } };
    }

    if (params.input.locID) {
      const location = await locationRepository.getById(params.input.locID);
      if (!location) throw new HttpError(404, "Drop-off location not found");
      updateData.location = { connect: { locID: params.input.locID } };
    }

    if (params.input.foodID) {
      const food = await foodRepository.getById(params.input.foodID);
      if (!food) throw new HttpError(404, "Food not found");
      if (food.userID !== params.userID)
        throw new HttpError(403, "Food does not belong to donor");
      updateData.food = { connect: { foodID: params.input.foodID } };
    }

    if (params.input.quantity !== undefined)
      updateData.quantity = params.input.quantity;
    if (params.input.scheduledTime)
      updateData.scheduledTime = new Date(params.input.scheduledTime);
    if (params.input.photoProof !== undefined)
      updateData.photoProof = params.input.photoProof;

    const distribution = await distributionRepository.update(
      params.disID,
      updateData,
    );
    return { distribution };
  },

  async updateDistributionStatus(params: {
    userID: string;
    disID: string;
    input: UpdateDistributionStatusInput;
  }) {
    await ensureProfile(params.userID);

    const existing = await distributionRepository.getById(params.disID);
    if (!existing) throw new HttpError(404, "Distribution not found");

    // Allow either donor or recipient to update status
    if (
      existing.donorID !== params.userID &&
      existing.recipientID !== params.userID
    ) {
      throw new HttpError(
        403,
        "Only donor or recipient can update distribution status",
      );
    }

    const distribution = await distributionRepository.updateStatus(
      params.disID,
      params.input.status,
    );
    return { distribution };
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
    if (
      existing.donorID !== params.userID &&
      existing.recipientID !== params.userID
    ) {
      throw new HttpError(403, "Forbidden");
    }

    const updated = await distributionRepository.update(params.disID, {
      actualTime: params.input.actualTime
        ? new Date(params.input.actualTime)
        : new Date(),
    });

    return { distribution: updated };
  },
};
