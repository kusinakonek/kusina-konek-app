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
 * Returns empty string if the data appears to be encrypted with a
 * different algorithm (e.g. PostgreSQL pgcrypto PGP data from old RPC).
 */
export const safeDecrypt = (text: string): string => {
    if (!text) return text;
    try {
        return decrypt(text);
    } catch {
        // Check if the text looks like unreadable encrypted/binary data
        // rather than legitimate plain text
        if (isLikelyEncryptedBinary(text)) {
            return ''; // Return empty rather than showing gibberish
        }
        return text;
    }
};

/**
 * Detect if a string appears to be encrypted/binary data that
 * shouldn't be displayed to users (e.g. pgcrypto PGP output stored as text).
 */
function isLikelyEncryptedBinary(text: string): boolean {
    // PostgreSQL bytea hex escape format
    if (text.startsWith('\\x')) return true;

    // Skip short strings — they're likely just normal text
    if (text.length < 8) return false;

    // Count non-printable or non-ASCII characters
    let nonPrintable = 0;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code < 32 || code > 126) {
            nonPrintable++;
        }
    }

    // If >25% of characters are non-printable, it's likely binary/encrypted
    if (nonPrintable / text.length > 0.25) return true;

    return false;
}

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
