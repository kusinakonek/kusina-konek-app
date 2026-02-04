import { CreateFoodInput, UpdateFoodInput } from "@kusinakonek/common";
import { HttpError } from "../middlewares/errorHandler";
import { foodRepository, userRepository } from "../repositories";

const ensureProfile = async (userID: string) => {
  const profile = await userRepository.getByUserId(userID);
  if (!profile) throw new HttpError(400, "Complete your profile first");
  return profile;
};

export const foodService = {
  async createFood(params: { userID: string; input: CreateFoodInput }) {
    await ensureProfile(params.userID);

    const created = await foodRepository.create(params.userID, {
      foodName: params.input.foodName,
      dateCooked: new Date(params.input.dateCooked),
      description: params.input.description,
      quantity: params.input.quantity,
      image: params.input.image
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
    return { food };
  },

  async updateFood(params: { userID: string; foodID: string; input: UpdateFoodInput }) {
    await ensureProfile(params.userID);
    const existing = await foodRepository.getById(params.foodID);
    if (!existing) throw new HttpError(404, "Food not found");
    if (existing.userID !== params.userID) throw new HttpError(403, "Forbidden");

    const updated = await foodRepository.update(params.foodID, {
      ...(params.input.foodName ? { foodName: params.input.foodName } : {}),
      ...(params.input.dateCooked ? { dateCooked: new Date(params.input.dateCooked) } : {}),
      ...(params.input.description !== undefined ? { description: params.input.description } : {}),
      ...(params.input.quantity !== undefined ? { quantity: params.input.quantity } : {}),
      ...(params.input.image !== undefined ? { image: params.input.image } : {})
    });

    return { food: updated };
  },

  async deleteFood(params: { userID: string; foodID: string }) {
    await ensureProfile(params.userID);
    const existing = await foodRepository.getById(params.foodID);
    if (!existing) throw new HttpError(404, "Food not found");
    if (existing.userID !== params.userID) throw new HttpError(403, "Forbidden");

    await foodRepository.delete(params.foodID);
    return { message: "Food deleted" };
  }
};
