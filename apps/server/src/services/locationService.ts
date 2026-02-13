import {
  CreateDropOffLocationInput,
  UpdateDropOffLocationInput,
} from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import {
  foodRepository,
  locationRepository,
  userRepository,
} from "../repositories";
import { encrypt, decrypt, safeDecrypt } from "../utils/encryption";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Please complete your profile first. Go to Profile > Edit Profile.");
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

// Helper to decrypt food data (nested in location)
const decryptFood = (food: any) => {
  if (!food) return null;
  return {
    ...food,
    foodName: safeDecrypt(food.foodName),
    description: food.description ? safeDecrypt(food.description) : null,
    image: food.image ? safeDecrypt(food.image) : null,
    user: food.user ? decryptUser(food.user) : undefined,
  };
};

// Helper to decrypt location data
const decryptLocation = (location: any) => {
  if (!location) return null;
  return {
    ...location,
    streetAddress: safeDecrypt(location.streetAddress),
    barangay: safeDecrypt(location.barangay),
    food: location.food ? decryptFood(location.food) : null,
    user: location.user ? decryptUser(location.user) : undefined,
  };
};

export const locationService = {
  async createLocation(params: {
    userID: string;
    input: CreateDropOffLocationInput;
  }) {
    await ensureProfile(params.userID);

    if (params.input.foodID) {
      const food = await foodRepository.getById(params.input.foodID);
      if (!food) throw new HttpError(404, "Food not found");
      if (food.userID !== params.userID) throw new HttpError(403, "Forbidden");
    }

    const location = await locationRepository.create(params.userID, {
      ...(params.input.foodID
        ? { food: { connect: { foodID: params.input.foodID } } }
        : {}),
      latitude: params.input.latitude,
      longitude: params.input.longitude,
      streetAddress: encrypt(params.input.streetAddress),
      barangay: params.input.barangay ? encrypt(params.input.barangay) : null,
    });

    return { location: decryptLocation(location) };
  },

  async listMyLocations(userID: string) {
    await ensureProfile(userID);
    const locations = await locationRepository.listByUser(userID);
    return { locations: locations.map(decryptLocation) };
  },

  async listLocationsForFood(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);
    const locations = await locationRepository.listByFood(params.foodID);
    return { locations: locations.map(decryptLocation) };
  },

  async updateLocation(params: {
    userID: string;
    locID: string;
    input: UpdateDropOffLocationInput;
  }) {
    await ensureProfile(params.userID);
    const existing = await locationRepository.getById(params.locID);
    if (!existing) throw new HttpError(404, "Location not found");
    if (existing.userID !== params.userID)
      throw new HttpError(403, "Forbidden");

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
      ...(params.input.latitude !== undefined
        ? { latitude: params.input.latitude }
        : {}),
      ...(params.input.longitude !== undefined
        ? { longitude: params.input.longitude }
        : {}),
      ...(params.input.streetAddress !== undefined
        ? { streetAddress: encrypt(params.input.streetAddress) }
        : {}),
      ...(params.input.barangay !== undefined
        ? { barangay: encrypt(params.input.barangay) }
        : {}),
    });

    return { location: decryptLocation(updated) };
  },

  async deleteLocation(params: { userID: string; locID: string }) {
    await ensureProfile(params.userID);
    const existing = await locationRepository.getById(params.locID);
    if (!existing) throw new HttpError(404, "Location not found");
    if (existing.userID !== params.userID)
      throw new HttpError(403, "Forbidden");

    await locationRepository.delete(params.locID);
    return { message: "Location deleted" };
  },
};
