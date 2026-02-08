export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
  },
  USER: {
    GET_PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/update",
  },
  FOOD: {
    GET_FOODS: "/foods",
    ADD_FOOD: "/foods/add",
    UPDATE_FOOD: "/foods/update",
    DELETE_FOOD: "/foods/delete",
  },
  LOCATION: {
    GET_LOCATIONS: "/locations",
    ADD_LOCATION: "/locations/add",
    UPDATE_LOCATION: "/locations/update",
    DELETE_LOCATION: "/locations/delete",
  },
  DISTRIBUTION: {
    GET_DISTRIBUTIONS: "/distributions",
    GET_AVAILABLE: "/distributions/available",
    GET_MINE: "/distributions/mine",
    ADD_DISTRIBUTION: "/distributions/add",
    UPDATE_DISTRIBUTION: "/distributions/update",
    DELETE_DISTRIBUTION: "/distributions/delete",
    REQUEST: (disID: string) => `/distributions/${disID}/request`,
  },
  FEEDBACK: {
    GET_FEEDBACKS: "/feedback",
    ADD_FEEDBACK: "/feedback/add",
  },
  DASHBOARD: {
    GET_STATS: "/dashboard/stats",
  },
};
