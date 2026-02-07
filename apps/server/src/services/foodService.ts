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
import { encrypt, decrypt } from "../utils/encryption";
import { locationService } from "./locationService";

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

// Helper to decrypt food data
const decryptFood = (food: any) => {
  return {
    ...food,
    foodName: decrypt(food.foodName),
    description: food.description ? decrypt(food.description) : null,
    image: food.image ? decrypt(food.image) : null,
    user: decryptUser(food.user),
    locations: food.locations?.map((loc: any) => {
      try {
        return {
          ...loc,
          streetAddress: decrypt(loc.streetAddress),
          barangay: decrypt(loc.barangay),
          user: decryptUser(loc.user),
        };
      } catch (error) {
        // If location decryption fails, return original
        return loc;
      }
    }),
  };
};

// Helper to decrypt distribution data (simplified for food service)
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
    };
  } catch (error) {
    // If decryption fails, return original (data might not be encrypted)
    return distribution;
  }
};

export const foodService = {
  async createFood(params: { userID: string; input: CreateFoodInput }) {
    await ensureProfile(params.userID);

    const created = await foodRepository.create(params.userID, {
      foodName: params.input.foodName,
      dateCooked: new Date(params.input.dateCooked),
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
    const encryptedFoodData = {
      foodName: encrypt(params.input.foodName),
      dateCooked: new Date(params.input.dateCooked),
      description: params.input.description
        ? encrypt(params.input.description)
        : undefined,
      quantity: params.input.quantity,
      image: params.input.image ? encrypt(params.input.image) : undefined,
    };

    // Create food first
    const created = await foodRepository.create(
      params.userID,
      encryptedFoodData,
    );

    // Create locations using existing locationService if provided
    let dropOffLocationID: string | undefined;
    if (params.input.locations && params.input.locations.length > 0) {
      for (const loc of params.input.locations) {
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
        if (!dropOffLocationID) {
          dropOffLocationID = location.location.locID;
        }
      }
    }

    if (!dropOffLocationID) {
      throw new HttpError(400, "At least one drop-off location is required");
    }

    const distribution = await distributionRepository.create({
      donor: { connect: { userID: params.userID } },
      location: { connect: { locID: dropOffLocationID } },
      food: { connect: { foodID: created.foodID } },
      quantity: params.input.quantity,
      scheduledTime: new Date(params.input.scheduledTime),
      photoProof: params.input.photoProof,
      status: "PENDING",
    });

    const decryptedFood = decryptFood(created);
    const decryptedDistribution = decryptDistribution(distribution);
    return { food: decryptedFood, distribution: decryptedDistribution };
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
      encryptedData.foodName = encrypt(params.input.foodName);
    }
    if (params.input.description !== undefined) {
      encryptedData.description = params.input.description
        ? encrypt(params.input.description)
        : null;
    }
    if (params.input.image !== undefined) {
      encryptedData.image = params.input.image
        ? encrypt(params.input.image)
        : null;
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
      status: "CLAIMED",
    });

    const decryptedDistribution = decryptDistribution(distribution);
    return { distribution: decryptedDistribution };
  },
};
