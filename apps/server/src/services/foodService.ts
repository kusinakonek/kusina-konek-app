import { CreateFoodInput, UpdateFoodInput } from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import { foodRepository, userRepository } from "../repositories";
import { encrypt, decrypt } from "../utils/encryption";
import { locationService } from "./locationService";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Complete your profile first");
  return profile;
};

// Helper to decrypt food data
const decryptFood = (food: any) => {
  return {
    ...food,
    foodName: decrypt(food.foodName),
    description: food.description ? decrypt(food.description) : null,
    image: food.image ? decrypt(food.image) : null,
    locations: food.locations?.map((loc: any) => {
      try {
        return {
          ...loc,
          streetAddress: decrypt(loc.streetAddress),
          barangay: decrypt(loc.barangay),
        };
      } catch (error) {
        // If location decryption fails, return original
        return loc;
      }
    }),
  };
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

    return { food: created };
  },

  async listMyFoods(userID: string) {
    await ensureProfile(userID);
    const foods = await foodRepository.listByUser(userID);
    return { foods };
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

    return { food: updated };
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
    if (params.input.locations && params.input.locations.length > 0) {
      for (const loc of params.input.locations) {
        await locationService.createLocation({
          userID: params.userID,
          input: {
            foodID: created.foodID,
            latitude: loc.latitude,
            longitude: loc.longitude,
            streetAddress: loc.streetAddress,
            barangay: loc.barangay,
          },
        });
      }
    }
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
};
