import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '@kusinakonek/database';

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
 * Decrypt using PostgreSQL pgcrypto (for old PGP-encrypted data)
 * Falls back to returning empty string if decryption fails
 */
export const pgDecrypt = async (text: string | null | undefined): Promise<string> => {
    if (!text) return '';
    try {
        const result = await prisma.$queryRaw<[{ decrypted: string }]>`
            SELECT pgp_sym_decrypt(decode(${text}, 'hex'), ${env.ENCRYPTION_KEY}) AS decrypted
        `;
        return result[0]?.decrypted || '';
    } catch (error) {
        console.warn('PG decryption failed:', error);
        return '';
    }
};

/**
 * Safely decrypt text  tries AES first, then PostgreSQL pgcrypto for old data.
 * This is an async wrapper that should be used in services that need to handle
 * both new AES and old PGP encrypted data.
 */
export const safeDecryptAsync = async (text: string | null | undefined): Promise<string> => {
    if (!text) return '';
    
    // Try AES decryption first (fast, synchronous)
    try {
        return decrypt(text);
    } catch {
        // If it looks like PGP data, try PostgreSQL decryption
        if (isLikelyEncryptedBinary(text)) {
            return await pgDecrypt(text);
        }
        // Plain text — return as-is
        return text;
    }
};

/**
 * Safely decrypt text — returns the original string if it is not
 * in the expected IV:AuthTag:Data format (e.g. plain-text seed data).
 * Returns empty string if the data appears to be encrypted with a
 * different algorithm (e.g. PostgreSQL pgcrypto PGP data from old RPC).
 * NOTE: This is synchronous and cannot decrypt PGP data. Use safeDecryptAsync for that.
 */
export const safeDecrypt = (text: string | null | undefined): string => {
    if (!text) return '';
    try {
        return decrypt(text);
    } catch {
        // Check if the text looks like unreadable encrypted/binary data
        // rather than legitimate plain text
        if (isLikelyEncryptedBinary(text)) {
            return ''; // Can't decrypt PGP synchronously
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

    // Detect pgcrypto PGP data: starts with c30d (PGP packet header)
    // and contains only hex characters. These are long hex strings
    // produced by Supabase RPC pgp_sym_encrypt stored as text.
    if (text.length > 40 && /^[0-9a-fA-F]+$/.test(text)) return true;

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
