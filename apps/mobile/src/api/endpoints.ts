export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  USER: {
    GET_PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/update',
  },
  FOOD: {
    GET_FOODS: '/food',
    ADD_FOOD: '/food/add',
    UPDATE_FOOD: '/food/update',
    DELETE_FOOD: '/food/delete',
  },
  LOCATION: {
    GET_LOCATIONS: '/location',
    ADD_LOCATION: '/location/add',
    UPDATE_LOCATION: '/location/update',
    DELETE_LOCATION: '/location/delete',
  },
  DISTRIBUTION: {
    GET_DISTRIBUTIONS: '/distribution',
    ADD_DISTRIBUTION: '/distribution/add',
    UPDATE_DISTRIBUTION: '/distribution/update',
    DELETE_DISTRIBUTION: '/distribution/delete',
  },
  FEEDBACK: {
    GET_FEEDBACKS: '/feedback',
    ADD_FEEDBACK: '/feedback/add',
  },
  DASHBOARD: {
    GET_STATS: '/dashboard/stats',
  },
};