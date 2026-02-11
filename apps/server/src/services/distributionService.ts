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

// Helper to decrypt user data (only decrypt fields that exist)
const decryptUser = (user: any) => {
  if (!user) return null;
  const decrypted: any = { ...user };
  if (user.firstName) decrypted.firstName = safeDecrypt(user.firstName);
  if (user.middleName) decrypted.middleName = safeDecrypt(user.middleName);
  if (user.lastName) decrypted.lastName = safeDecrypt(user.lastName);
  if (user.suffix) decrypted.suffix = safeDecrypt(user.suffix);
  if (user.phoneNo) decrypted.phoneNo = safeDecrypt(user.phoneNo);
  if (user.email) decrypted.email = safeDecrypt(user.email);
  if (user.orgName) decrypted.orgName = safeDecrypt(user.orgName);
  return decrypted;
};

// Helper to decrypt location data (only decrypt fields that exist)
const decryptLocation = (location: any) => {
  if (!location) return null;
  const decrypted: any = { ...location };
  if (location.streetAddress)
    decrypted.streetAddress = safeDecrypt(location.streetAddress);
  if (location.barangay) decrypted.barangay = safeDecrypt(location.barangay);
  return decrypted;
};

// Helper to decrypt distribution data (optimized)
const decryptDistribution = (distribution: any) => {
  const decrypted: any = { ...distribution };

  if (distribution.photoProof) {
    decrypted.photoProof = safeDecrypt(distribution.photoProof);
  }

  if (distribution.donor) {
    decrypted.donor = decryptUser(distribution.donor);
  }

  if (distribution.recipient) {
    decrypted.recipient = decryptUser(distribution.recipient);
  }

  if (distribution.location) {
    decrypted.location = decryptLocation(distribution.location);
  }

  if (distribution.food) {
    decrypted.food = {
      ...distribution.food,
      foodName: safeDecrypt(distribution.food.foodName),
      description: distribution.food.description
        ? safeDecrypt(distribution.food.description)
        : null,
      image: distribution.food.image
        ? safeDecrypt(distribution.food.image)
        : null,
    };
    if (distribution.food.user) {
      decrypted.food.user = decryptUser(distribution.food.user);
    }
  }

  if (distribution.feedbacks?.length) {
    decrypted.feedbacks = distribution.feedbacks.map((feedback: any) => ({
      ...feedback,
      donor: decryptUser(feedback.donor),
      recipient: decryptUser(feedback.recipient),
    }));
  }

  return decrypted;
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

  async listAvailableDistributions(excludeDonorID?: string) {
    // Exclude the donor's own distributions to prevent self-claiming (anti-cheat)
    const distributions =
      await distributionRepository.listAvailable(excludeDonorID);
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
      claimedAt: new Date(),
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
