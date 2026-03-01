import {
  CreateFoodInput,
  UpdateFoodInput,
  RequestDonationInput,
} from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import {
  foodRepository,
  userRepository,
  distributionRepository,
} from "../repositories";
import { encrypt, decrypt, safeDecrypt } from "../utils/encryption";
import { locationService } from "./locationService";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Please complete your profile before creating donations. Go to Profile > Edit Profile.");
  return profile;
};

// Helper to decrypt user data
const decryptUser = (user: any) => {
  if (!user) return null;
  return {
    ...user,
    firstName: user.firstName ? safeDecrypt(user.firstName) : null,
    middleName: user.middleName ? safeDecrypt(user.middleName) : null,
    lastName: user.lastName ? safeDecrypt(user.lastName) : null,
    suffix: user.suffix ? safeDecrypt(user.suffix) : null,
    phoneNo: user.phoneNo ? safeDecrypt(user.phoneNo) : null,
    email: user.email ? safeDecrypt(user.email) : null,
    orgName: user.orgName ? safeDecrypt(user.orgName) : null,
  };
};

// Helper to decrypt food data
const decryptFood = (food: any) => {
  return {
    ...food,
    // No more manual decryption loops here! The DB resolves these fast.
    foodName: food.foodName,
    description: food.description,
    image: food.image,
    user: decryptUser(food.user),
    locations: food.locations?.map((loc: any) => ({
      ...loc,
      streetAddress: loc.streetAddress,
      barangay: loc.barangay,
      user: decryptUser(loc.user),
    })),
  };
};

// Helper to decrypt distribution data (simplified for food service)
const decryptDistribution = (distribution: any) => {
  return {
    ...distribution,
    photoProof: distribution.photoProof,
    donor: decryptUser(distribution.donor),
    recipient: decryptUser(distribution.recipient),
    location: distribution.location
      ? {
        ...distribution.location,
        streetAddress: distribution.location.streetAddress,
        barangay: distribution.location.barangay,
      }
      : null,
    food: distribution.food
      ? {
        ...distribution.food,
        foodName: distribution.food.foodName,
        description: distribution.food.description,
        image: distribution.food.image,
        user: decryptUser(distribution.food.user),
      }
      : null,
  };
};

export const foodService = {
  async createFood(params: { userID: string; input: CreateFoodInput }) {
    await ensureProfile(params.userID);

    const created = await foodRepository.create(params.userID, {
      foodName: params.input.foodName,
      dateCooked: params.input.dateCooked
        ? new Date(params.input.dateCooked)
        : null,
      description: params.input.description,
      quantity: params.input.quantity,
      image: params.input.image,
    });

    const decryptedFood = decryptFood(created);
    return { food: decryptedFood };
  },

  async listMyFoods(userID: string) {
    await ensureProfile(userID);
    const foods = await foodRepository.listByUser(userID);
    const decryptedFoods = foods.map((food) => {
      try {
        return decryptFood(food);
      } catch (error) {
        return food; // Return original if decryption fails
      }
    });
    return { foods: decryptedFoods };
  },

  async getFood(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);
    const food = await foodRepository.getById(params.foodID);
    if (!food) throw new HttpError(404, "Food not found");

    // Decrypt food data (with fallback for unencrypted data)
    let decryptedFood;
    try {
      decryptedFood = decryptFood(food);
    } catch (error) {
      // If decryption fails, return original (data not encrypted)
      decryptedFood = food;
    }

    return { food: decryptedFood };
  },

  async updateFood(params: {
    userID: string;
    foodID: string;
    input: UpdateFoodInput;
  }) {
    await ensureProfile(params.userID);
    const existing = await foodRepository.getById(params.foodID);
    if (!existing) throw new HttpError(404, "Food not found");
    if (existing.userID !== params.userID)
      throw new HttpError(403, "Forbidden");

    const updated = await foodRepository.update(params.foodID, {
      ...(params.input.foodName ? { foodName: params.input.foodName } : {}),
      ...(params.input.dateCooked
        ? { dateCooked: new Date(params.input.dateCooked) }
        : {}),
      ...(params.input.description !== undefined
        ? { description: params.input.description }
        : {}),
      ...(params.input.quantity !== undefined
        ? { quantity: params.input.quantity }
        : {}),
      ...(params.input.image !== undefined
        ? { image: params.input.image }
        : {}),
    });

    const decryptedFood = decryptFood(updated);
    return { food: decryptedFood };
  },

  async deleteFood(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);
    const existing = await foodRepository.getById(params.foodID);
    if (!existing) throw new HttpError(404, "Food not found");
    if (existing.userID !== params.userID)
      throw new HttpError(403, "Forbidden");

    await foodRepository.delete(params.foodID);
    return { message: "Food deleted" };
  },

  // Donation-specific services with encryption
  async createDonation(params: { userID: string; input: CreateFoodInput }) {
    await ensureProfile(params.userID);

    // Encrypt sensitive data before storing
    // Encrypt sensitive data before storing
    const encryptedFoodData = {
      foodName: params.input.foodName,
      dateCooked: params.input.dateCooked
        ? new Date(params.input.dateCooked)
        : null,
      description: params.input.description,
      quantity: params.input.quantity,
      image: params.input.image,
    };

    // Create food first
    console.time(`DB_FOOD_CREATE_${params.userID}`);
    const created = await foodRepository.create(
      params.userID,
      encryptedFoodData,
    );
    console.timeEnd(`DB_FOOD_CREATE_${params.userID}`);

    // Create locations using existing locationService if provided
    let dropOffLocationID: string | undefined;
    let mainLatitude: number | undefined;
    let mainLongitude: number | undefined;

    if (params.input.locations && params.input.locations.length > 0) {
      for (const loc of params.input.locations) {
        console.time(`DB_LOC_CREATE_${params.userID}`);
        const location = await locationService.createLocation({
          userID: params.userID,
          input: {
            foodID: created.foodID,
            latitude: loc.latitude,
            longitude: loc.longitude,
            streetAddress: loc.streetAddress,
            barangay: loc.barangay,
          },
        });
        console.timeEnd(`DB_LOC_CREATE_${params.userID}`);
        if (!dropOffLocationID) {
          dropOffLocationID = location.location.locID;
          mainLatitude = loc.latitude;
          mainLongitude = loc.longitude;
        }
      }
    }

    if (!dropOffLocationID) {
      throw new HttpError(400, "At least one drop-off location is required");
    }

    console.time(`DB_DIST_CREATE_${params.userID}`);
    const distribution = await distributionRepository.create({
      donor: { connect: { userID: params.userID } },
      location: { connect: { locID: dropOffLocationID } },
      food: { connect: { foodID: created.foodID } },
      quantity: params.input.quantity,
      scheduledTime: new Date(params.input.scheduledTime),
      photoProof: params.input.photoProof,
      status: "PENDING",
    });
    console.timeEnd(`DB_DIST_CREATE_${params.userID}`);

    if (mainLatitude !== undefined && mainLongitude !== undefined) {
      import("./notificationService").then(ns =>
        ns.notificationService.notifyNearbyRecipients(
          mainLatitude!,
          mainLongitude!,
          "New Food Nearby!",
          `${params.input.foodName} is available near you!`,
          { screen: "RecipientHome", foodID: created.foodID },
          3.0,
          params.userID
        )
      ).catch(error => console.error("Failed to notify nearby recipients", error));
    }

    // Bypass the heavy, nested decryption logic completely. DB inserts resolve fast!
    return { food: created, distribution };
  },

  async getAllDonations(userID: string) {
    await ensureProfile(userID);
    const donations = await foodRepository.listAll(); // Get ALL foods, not just user's

    // Decrypt donations that are encrypted
    const decryptedDonations = donations.map((food) => {
      try {
        return decryptFood(food);
      } catch (error) {
        // If decryption fails, return original (data not encrypted)
        return food;
      }
    });

    return { donations: decryptedDonations };
  },

  async getDonationsByUserId(params: {
    requestingUserID: string;
    targetUserID: string;
  }) {
    await ensureProfile(params.requestingUserID);
    const donations = await foodRepository.listByUser(params.targetUserID);

    // Decrypt donations that are encrypted
    const decryptedDonations = donations.map((food) => {
      try {
        return decryptFood(food);
      } catch (error) {
        // If decryption fails, return original (data not encrypted)
        return food;
      }
    });

    return { donations: decryptedDonations };
  },

  async getDonationById(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);
    const donation = await foodRepository.getById(params.foodID);

    if (!donation) throw new HttpError(404, "Donation not found");
    // Allow any authenticated user to view any donation (removed ownership check)

    // Decrypt donation data (with fallback for unencrypted data)
    let decryptedDonation;
    try {
      decryptedDonation = decryptFood(donation);
    } catch (error) {
      // If decryption fails, return original (data not encrypted)
      decryptedDonation = donation;
    }

    return { donation: decryptedDonation };
  },

  async updateDonation(params: {
    userID: string;
    foodID: string;
    input: UpdateFoodInput;
  }) {
    await ensureProfile(params.userID);
    const existing = await foodRepository.getById(params.foodID);

    if (!existing) throw new HttpError(404, "Donation not found");
    if (existing.userID !== params.userID)
      throw new HttpError(403, "Forbidden");

    // Encrypt data before storing
    const encryptedData: any = {};

    if (params.input.foodName) {
      encryptedData.foodName = params.input.foodName;
    }
    if (params.input.description !== undefined) {
      encryptedData.description = params.input.description;
    }
    if (params.input.image !== undefined) {
      encryptedData.image = params.input.image;
    }
    if (params.input.dateCooked) {
      encryptedData.dateCooked = new Date(params.input.dateCooked);
    }
    if (params.input.quantity !== undefined) {
      encryptedData.quantity = params.input.quantity;
    }

    const updated = await foodRepository.update(params.foodID, encryptedData);

    // Handle location updates if provided
    if (params.input.locations && params.input.locations.length > 0) {
      // Get existing locations for this food
      const existingLocations = await locationService.listLocationsForFood({
        userID: params.userID,
        foodID: params.foodID,
      });

      // Delete existing locations
      for (const loc of existingLocations.locations) {
        await locationService.deleteLocation({
          userID: params.userID,
          locID: loc.locID,
        });
      }

      // Create new locations
      for (const loc of params.input.locations) {
        await locationService.createLocation({
          userID: params.userID,
          input: {
            foodID: params.foodID,
            latitude: loc.latitude,
            longitude: loc.longitude,
            streetAddress: loc.streetAddress,
            barangay: loc.barangay,
          },
        });
      }
    }

    // Fetch updated food with locations
    const finalFood = await foodRepository.getById(params.foodID);

    // Decrypt before returning
    let decryptedDonation;
    try {
      decryptedDonation = decryptFood(finalFood!);
    } catch (error) {
      decryptedDonation = finalFood;
    }

    return { donation: decryptedDonation };
  },

  async deleteDonation(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);
    const existing = await foodRepository.getById(params.foodID);

    if (!existing) throw new HttpError(404, "Donation not found");
    if (existing.userID !== params.userID)
      throw new HttpError(403, "Forbidden");

    // Delete associated locations first
    const locations = await locationService.listLocationsForFood({
      userID: params.userID,
      foodID: params.foodID,
    });

    for (const loc of locations.locations) {
      await locationService.deleteLocation({
        userID: params.userID,
        locID: loc.locID,
      });
    }

    // Delete the food/donation
    await foodRepository.delete(params.foodID);

    return {
      message: "Donation and associated locations deleted successfully",
    };
  },

  async cancelDonation(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);
    const existing = await foodRepository.getById(params.foodID);

    if (!existing) throw new HttpError(404, "Donation not found");
    if (existing.userID !== params.userID)
      throw new HttpError(403, "Forbidden");

    // Check if distribution exists for this food and its status
    const distribution = await distributionRepository.getByFoodId(params.foodID);

    // Only allow cancellation if nobody has claimed it (PENDING status) or if no distribution exists
    if (distribution && distribution.status !== "PENDING") {
      throw new HttpError(400, "Cannot cancel a donation that has already been claimed or completed");
    }

    // Delete associated locations first
    const locations = await locationService.listLocationsForFood({
      userID: params.userID,
      foodID: params.foodID,
    });

    for (const loc of locations.locations) {
      await locationService.deleteLocation({
        userID: params.userID,
        locID: loc.locID,
      });
    }

    // Delete distribution if it exists (prisma constraints might cascade this, but safe to be explicit)
    if (distribution) {
      await distributionRepository.delete(distribution.disID);
    }

    // Finally delete the food/donation itself
    await foodRepository.delete(params.foodID);

    return {
      message: "Donation has been successfully cancelled and removed",
    };
  },

  async requestDonation(params: {
    recipientID: string;
    input: RequestDonationInput;
  }) {
    await ensureProfile(params.recipientID);

    const existing = await distributionRepository.getByFoodId(
      params.input.foodID,
    );
    if (!existing) throw new HttpError(404, "Distribution not found");
    if (existing.recipientID) {
      throw new HttpError(409, "Donation already claimed");
    }
    if (existing.status !== "PENDING") {
      throw new HttpError(409, "Donation not available for claiming");
    }

    const distribution = await distributionRepository.update(existing.disID, {
      recipient: { connect: { userID: params.recipientID } },
      scheduledTime: new Date(params.input.scheduledTime),
      photoProof: params.input.photoProof,
      status: "ON_THE_WAY",
    });

    const decryptedDistribution = decryptDistribution(distribution);

    // Notify Donor
    try {
      const recipientName = (await userRepository.getByUserId(params.recipientID))?.firstName || "A recipient";
      // Need to decrypt recipient name properly? userRepo returns encrypted... 
      // ensuring we get decrypted Profile helpful?
      // actually foodService.ensureProfile calls userRepo.getByUserId which returns encrypted. 
      // We should use userService.getProfile properly? 
      // For speed, I will just say "Someone" or use the ID if we can't easily decrypt here without importing userService (circular dependency risk?)
      // actually we can import specific utils. 
      // Let's keep it simple for now: "Your donation has been claimed!"

      const donorID = existing.donorID;
      await import("./notificationService").then(ns =>
        ns.notificationService.notifyUser(
          donorID,
          "Food Claimed!",
          "Your donation is now marked as On The Way.",
          "CLAIM",
          { screen: "DonorHome", disID: distribution.disID }, // Deep linking data
          distribution.disID
        )
      );
    } catch (error) {
      console.error("Failed to send notification", error);
    }

    return { distribution: decryptedDistribution };
  },

  async confirmDonation(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);

    // Check if distribution exists for this food
    const distribution = await distributionRepository.getByFoodId(params.foodID);

    if (!distribution) throw new HttpError(404, "Distribution not found");

    // Check if the user is the RECIPIENT (not the donor)
    if (distribution.recipientID !== params.userID) {
      throw new HttpError(403, "Forbidden: Only the recipient can confirm receipt");
    }

    if (distribution.status !== "ON_THE_WAY") throw new HttpError(400, "Donation cannot be confirmed yet");

    const updated = await distributionRepository.update(distribution.disID, {
      status: "COMPLETED",
      claimedAt: new Date()
    });

    // Notify Donor
    try {
      const donorID = distribution.donorID;
      await import("./notificationService").then(ns =>
        ns.notificationService.notifyUser(
          donorID,
          "Donation Completed!",
          "The recipient has confirmed receipt of your donation.",
          "CONFIRM",
          { screen: "History", disID: distribution.disID },
          distribution.disID
        )
      );
    } catch (error) {
      console.error("Failed to send notification to donor", error);
    }

    return { distribution: decryptDistribution(updated) };
  },
};
