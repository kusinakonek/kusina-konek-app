import {
  CreateDistributionInput,
  MarkDistributionCompleteInput,
  UpdateDistributionInput,
  UpdateDistributionStatusInput,
  RequestDistributionInput,
  Role,
} from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import {
  distributionRepository,
  foodRepository,
  locationRepository,
  userRepository,
} from "../repositories";
import { encrypt, decrypt, safeDecrypt } from "../utils/encryption";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Complete your profile first");
  return profile;
};

// Helper to decrypt user data (each field independent)
const decryptUser = (user: any) => {
  if (!user) return null;
  return {
    ...user,
    firstName: safeDecrypt(user.firstName),
    middleName: safeDecrypt(user.middleName),
    lastName: safeDecrypt(user.lastName),
    suffix: safeDecrypt(user.suffix),
    phoneNo: safeDecrypt(user.phoneNo),
    email: safeDecrypt(user.email),
    orgName: safeDecrypt(user.orgName),
  };
};

// Helper to decrypt location data (each field independent)
const decryptLocation = (location: any) => {
  if (!location) return null;
  return {
    ...location,
    streetAddress: safeDecrypt(location.streetAddress),
    barangay: safeDecrypt(location.barangay),
  };
};

// Helper to decrypt distribution data (each section independent)
const decryptDistribution = (distribution: any) => {
  return {
    ...distribution,
    photoProof: safeDecrypt(distribution.photoProof),
    donor: decryptUser(distribution.donor),
    recipient: decryptUser(distribution.recipient),
    location: decryptLocation(distribution.location),
    food: distribution.food
      ? {
          ...distribution.food,
          foodName: safeDecrypt(distribution.food.foodName),
          description: safeDecrypt(distribution.food.description),
          image: safeDecrypt(distribution.food.image),
          user: decryptUser(distribution.food.user),
        }
      : null,
    feedbacks:
      distribution.feedbacks?.map((feedback: any) => ({
        ...feedback,
        donor: decryptUser(feedback.donor),
        recipient: decryptUser(feedback.recipient),
      })) || [],
  };
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

    // Only validate recipient if provided
    if (params.input.recipientID) {
      const recipient = await userRepository.getByUserId(
        params.input.recipientID,
      );
      if (!recipient) throw new HttpError(404, "Recipient profile not found");
    }

    const location = await locationRepository.getById(params.input.locID);
    if (!location) throw new HttpError(404, "Drop-off location not found");

    const food = await foodRepository.getById(params.input.foodID);
    if (!food) throw new HttpError(404, "Food not found");
    if (food.userID !== params.donorID)
      throw new HttpError(403, "Food does not belong to donor");

    const distribution = await distributionRepository.create({
      donor: { connect: { userID: params.donorID } },
      recipient: params.input.recipientID
        ? { connect: { userID: params.input.recipientID } }
        : undefined,
      location: { connect: { locID: params.input.locID } },
      food: { connect: { foodID: params.input.foodID } },
      quantity: params.input.quantity,
      scheduledTime: new Date(params.input.scheduledTime),
      photoProof: params.input.photoProof,
    });

    const decryptedDistribution = decryptDistribution(distribution);
    return { distribution: decryptedDistribution };
  },

  async getDistribution(userID: string, disID: string) {
    await ensureProfile(userID);

    const distribution = await distributionRepository.getById(disID);
    if (!distribution) throw new HttpError(404, "Distribution not found");

    const decryptedDistribution = decryptDistribution(distribution);
    return { distribution: decryptedDistribution };
  },

  async getAllDistributions(userID: string) {
    await ensureProfile(userID);

    const distributions = await distributionRepository.getAll();
    const decryptedDistributions = distributions.map(decryptDistribution);
    return { distributions: decryptedDistributions };
  },

  async listMyDistributions(userID: string) {
    await ensureProfile(userID);
    const distributions = await distributionRepository.listForUser(userID);
    const decryptedDistributions = distributions.map(decryptDistribution);
    return { distributions: decryptedDistributions };
  },

  async listAvailableDistributions() {
    // No auth required - public endpoint for browsing available distributions
    const distributions = await distributionRepository.listAvailable();
    const decryptedDistributions = distributions.map(decryptDistribution);
    return { distributions: decryptedDistributions };
  },

  async listDistributionsForRecipient(recipientID: string) {
    // List distributions assigned to a specific recipient
    const distributions =
      await distributionRepository.listForRecipient(recipientID);
    const decryptedDistributions = distributions.map(decryptDistribution);
    return { distributions: decryptedDistributions };
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
    const decryptedDistribution = decryptDistribution(distribution);
    return { distribution: decryptedDistribution };
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
    const decryptedDistribution = decryptDistribution(distribution);
    return { distribution: decryptedDistribution };
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
      status: "COMPLETED",
    });

    const decryptedDistribution = decryptDistribution(updated);
    return { distribution: decryptedDistribution };
  },

  async requestDistribution(params: {
    userID: string;
    userRole?: string;
    disID: string;
    input: RequestDistributionInput;
  }) {
    await ensureProfile(params.userID);

    if ((params.userRole as Role | undefined) !== "RECIPIENT") {
      throw new HttpError(403, "Only recipients can request distributions");
    }

    const existing = await distributionRepository.getById(params.disID);
    if (!existing) throw new HttpError(404, "Distribution not found");

    // Check if distribution is available for claiming
    if (existing.status !== "PENDING") {
      throw new HttpError(409, "Distribution is not available for claiming");
    }

    // Check if distribution already has a recipient
    if (existing.recipientID) {
      throw new HttpError(409, "Distribution already has a recipient");
    }

    // Update distribution with recipient and change status to CLAIMED
    const updated = await distributionRepository.update(params.disID, {
      recipient: { connect: { userID: params.userID } },
      status: "CLAIMED",
      ...(params.input.scheduledTime
        ? {
            scheduledTime: new Date(params.input.scheduledTime),
          }
        : {}),
      ...(params.input.photoProof
        ? {
            photoProof: params.input.photoProof,
          }
        : {}),
    });

    const decryptedDistribution = decryptDistribution(updated);
    return { distribution: decryptedDistribution };
  },
};
