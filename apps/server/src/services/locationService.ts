import { CreateDropOffLocationInput, UpdateDropOffLocationInput } from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import { foodRepository, locationRepository, userRepository } from "../repositories";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Complete your profile first");
  return profile;
};

export const locationService = {
  async createLocation(params: { userID: string; input: CreateDropOffLocationInput }) {
    await ensureProfile(params.userID);

    if (params.input.foodID) {
      const food = await foodRepository.getById(params.input.foodID);
      if (!food) throw new HttpError(404, "Food not found");
      if (food.userID !== params.userID) throw new HttpError(403, "Forbidden");
    }

    const location = await locationRepository.create(params.userID, {
      ...(params.input.foodID ? { food: { connect: { foodID: params.input.foodID } } } : {}),
      latitude: params.input.latitude,
      longitude: params.input.longitude,
      streetAddress: params.input.streetAddress,
      barangay: params.input.barangay
    });

    return { location };
  },

  async listMyLocations(userID: string) {
    await ensureProfile(userID);
    const locations = await locationRepository.listByUser(userID);
    return { locations };
  },

  async listLocationsForFood(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);
    const locations = await locationRepository.listByFood(params.foodID);
    return { locations };
  },

  async updateLocation(params: { userID: string; locID: string; input: UpdateDropOffLocationInput }) {
    await ensureProfile(params.userID);
    const existing = await locationRepository.getById(params.locID);
    if (!existing) throw new HttpError(404, "Location not found");
    if (existing.userID !== params.userID) throw new HttpError(403, "Forbidden");

    if (params.input.foodID) {
      const food = await foodRepository.getById(params.input.foodID);
      if (!food) throw new HttpError(404, "Food not found");
      if (food.userID !== params.userID) throw new HttpError(403, "Forbidden");
    }

    const updated = await locationRepository.update(params.locID, {
      ...(params.input.foodID !== undefined
        ? params.input.foodID
          ? { food: { connect: { foodID: params.input.foodID } } }
          : { food: { disconnect: true } }
        : {}),
      ...(params.input.latitude !== undefined ? { latitude: params.input.latitude } : {}),
      ...(params.input.longitude !== undefined ? { longitude: params.input.longitude } : {}),
      ...(params.input.streetAddress !== undefined ? { streetAddress: params.input.streetAddress } : {}),
      ...(params.input.barangay !== undefined ? { barangay: params.input.barangay } : {})
    });

    return { location: updated };
  },

  async deleteLocation(params: { userID: string; locID: string }) {
    await ensureProfile(params.userID);
    const existing = await locationRepository.getById(params.locID);
    if (!existing) throw new HttpError(404, "Location not found");
    if (existing.userID !== params.userID) throw new HttpError(403, "Forbidden");

    await locationRepository.delete(params.locID);
    return { message: "Location deleted" };
  }
};
