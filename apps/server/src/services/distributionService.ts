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

/**
 * Haversine formula: compute distance in km between two lat/lng points.
 */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile)
    throw new HttpError(
      400,
      "Please complete your profile first. Go to Profile > Edit Profile.",
    );
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

  async listAvailableDistributions(
    excludeDonorID?: string,
    userLat?: number,
    userLng?: number,
  ) {
    // Filter by today onwards so recipients only see current/future distributions
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const distributions = await distributionRepository.listAvailable(
      excludeDonorID,
      startOfDay,
    );
    const decrypted = distributions.map(decryptDistribution);

    // If user location is provided, compute distance and sort by nearest
    if (
      userLat !== undefined &&
      userLng !== undefined &&
      !isNaN(userLat) &&
      !isNaN(userLng)
    ) {
      const withDistance = decrypted.map((d: any) => {
        const loc = d.location;
        if (loc?.latitude != null && loc?.longitude != null) {
          const dist = haversineKm(
            userLat,
            userLng,
            loc.latitude,
            loc.longitude,
          );
          return { ...d, distanceKm: Math.round(dist * 10) / 10 };
        }
        return { ...d, distanceKm: null };
      });

      // Sort: items with distance first (ascending), then items without distance
      withDistance.sort((a: any, b: any) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      return { distributions: withDistance };
    }

    return { distributions: decrypted };
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

  /**
   * Get the recipient's claim usage (daily, weekly, monthly counts).
   * Limits: 1/day, 3/week, 5/month. Resets each calendar month.
   */
  async getClaimLimits(userID: string) {
    const now = new Date();

    // Start of today (midnight)
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Start of current week (Monday)
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - mondayOffset,
    );

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyClaims, weeklyClaims, monthlyClaims] = await Promise.all([
      distributionRepository.countClaimsSince(userID, startOfDay),
      distributionRepository.countClaimsSince(userID, startOfWeek),
      distributionRepository.countClaimsSince(userID, startOfMonth),
    ]);

    return {
      dailyClaims,
      weeklyClaims,
      monthlyClaims,
      maxDaily: 1,
      maxWeekly: 3,
      maxMonthly: 5,
      canClaim: dailyClaims < 1 && weeklyClaims < 3 && monthlyClaims < 5,
    };
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

    // --- Claim frequency limits: 1/day, 3/week, 5/month ---
    const limits = await this.getClaimLimits(params.userID);
    if (!limits.canClaim) {
      let reason = "claim limit";
      if (limits.monthlyClaims >= limits.maxMonthly) {
        reason = `monthly limit of ${limits.maxMonthly} claims`;
      } else if (limits.weeklyClaims >= limits.maxWeekly) {
        reason = `weekly limit of ${limits.maxWeekly} claims`;
      } else if (limits.dailyClaims >= limits.maxDaily) {
        reason = `daily limit of ${limits.maxDaily} claim`;
      }
      throw new HttpError(
        429,
        `You have reached your ${reason}. Please try again later.`,
      );
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
