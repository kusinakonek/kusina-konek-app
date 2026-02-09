import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const AUTH_TAG_LENGTH = 16;

// Ensure your ENCRYPTION_KEY in .env is 32 bytes (64 hex characters) or a 32-char string
// For production, always use a high-entropy hex string
const getKey = () => {
    const key = env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
    // If key is hex string of length 64, parse it
    if (key.length === 64) {
        return Buffer.from(key, 'hex');
    }
    // Fallback/Warning: If strictly 32 chars, use as raw buffer. 
    // Ideally user provides correct length.
    if (key.length === 32) {
        return Buffer.from(key, 'utf-8');
    }
    // Pad or error if not correct length - for safety, throw error
    throw new Error(`ENCRYPTION_KEY must be 32 bytes (64 hex chars). Current length: ${key.length}`);
};

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: IV:AuthTag:EncryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Safely decrypt text — returns the original string if it is not
 * in the expected IV:AuthTag:Data format (e.g. plain-text seed data).
 */
export const safeDecrypt = (text: string): string => {
    try {
        return decrypt(text);
    } catch {
        return text;
    }
};

export const decrypt = (text: string): string => {
    const parts = text.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
