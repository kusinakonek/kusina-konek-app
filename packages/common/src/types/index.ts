export type Role = "DONOR" | "RECIPIENT" | "VOLUNTEER";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface FoodItem {
  id: string;
  title: string;
  quantity: number;
  expiresAt: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  donorId: string;
}
