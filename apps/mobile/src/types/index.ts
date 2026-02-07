export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

export type ErrorResponse = {
  message: string;
  code?: number;
};