import { prisma } from '../src';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

// --- Encryption & Hashing Utils (Replicated from Server for Seeding) ---

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
// Get key from env - MUST match server's ENCRYPTION_KEY
const getKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    if (key.length === 64) return Buffer.from(key, 'hex');
    if (key.length === 32) return Buffer.from(key, 'utf-8');
    throw new Error(`ENCRYPTION_KEY must be 32 bytes (64 hex chars). Current length: ${key.length}`);
};

const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

// SHA-256 hash for indexed lookups (email, phone)
const sha256Hex = (str: string) => crypto.createHash('sha256').update(str).digest('hex');

// Bcrypt password hashing
const hashPassword = async (password: string) => await bcrypt.hash(password, 10);

// --- Main Seed Function ---

async function main() {
    console.log('🌱 Starting Seeding with Encryption...');

    console.log('Wiping existing data...');
    // Delete in order to respect foreign key constraints
    // await prisma.feedback.deleteMany({});
    // await prisma.distribution.deleteMany({});
    // await prisma.dropOffLocation.deleteMany({});
    // await prisma.food.deleteMany({});
    // await prisma.address.deleteMany({});
    // await prisma.user.deleteMany({});
    // We don't wipe Roles and Statuses entirely, just in case, but upsert will handle them nicely.

    // 1. Roles
    console.log('Creating Roles...');
    await prisma.role.upsert({ where: { roleName: 'ADMIN' }, update: {}, create: { roleName: 'ADMIN' } });
    await prisma.role.upsert({ where: { roleName: 'DONOR' }, update: {}, create: { roleName: 'DONOR' } });
    await prisma.role.upsert({ where: { roleName: 'RECIPIENT' }, update: {}, create: { roleName: 'RECIPIENT' } });
    await prisma.role.upsert({ where: { roleName: 'VOLUNTEER' }, update: {}, create: { roleName: 'VOLUNTEER' } });

    // 2. Statuses
    console.log('Creating Statuses...');
    const statuses = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    for (const statusName of statuses) {
        await prisma.status.upsert({ where: { statusName }, update: {}, create: { statusName } });
    }

    console.log('✅ Seeding completed with Roles and Statuses only.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
