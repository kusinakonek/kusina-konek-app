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
import { encrypt, decrypt } from "../utils/encryption";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Complete your profile first");
  return profile;
};

// Helper to decrypt user data
const decryptUser = (user: any) => {
  if (!user) return null;
  try {
    return {
      ...user,
      firstName: user.firstName ? decrypt(user.firstName) : null,
      middleName: user.middleName ? decrypt(user.middleName) : null,
      lastName: user.lastName ? decrypt(user.lastName) : null,
      suffix: user.suffix ? decrypt(user.suffix) : null,
      phoneNo: user.phoneNo ? decrypt(user.phoneNo) : null,
      email: user.email ? decrypt(user.email) : null,
      orgName: user.orgName ? decrypt(user.orgName) : null,
    };
  } catch (error) {
    // If decryption fails, return original (data might not be encrypted)
    return user;
  }
};

// Helper to decrypt distribution data
const decryptDistribution = (distribution: any) => {
  try {
    return {
      ...distribution,
      photoProof: distribution.photoProof
        ? decrypt(distribution.photoProof)
        : null,
      donor: decryptUser(distribution.donor),
      recipient: decryptUser(distribution.recipient),
      location: distribution.location
        ? {
            ...distribution.location,
            streetAddress: decrypt(distribution.location.streetAddress),
            barangay: decrypt(distribution.location.barangay),
          }
        : null,
      food: distribution.food
        ? {
            ...distribution.food,
            foodName: decrypt(distribution.food.foodName),
            description: distribution.food.description
              ? decrypt(distribution.food.description)
              : null,
            image: distribution.food.image
              ? decrypt(distribution.food.image)
              : null,
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
  } catch (error) {
    // If decryption fails, return original (data might not be encrypted)
    return distribution;
  }
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
