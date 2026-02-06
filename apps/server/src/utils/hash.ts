import crypto from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// SHA-256 hash for indexed lookups (email, phone)
export const sha256Hex = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

// Bcrypt password hashing
export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
