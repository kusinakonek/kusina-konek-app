import { prisma } from '@kusinakonek/database';
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

    // 3. Users
    console.log('Creating Users...');

    // Admin
    const adminEmail = 'admin@gmail.com';
    const adminPhone = '09170000000';


    const admin = await prisma.user.upsert({
        where: { emailHash: sha256Hex(adminEmail) },
        update: {},
        create: {
            firstName: encrypt('Admin'),
            lastName: encrypt('User'),
            phoneNo: encrypt(adminPhone),
            phoneNoHash: sha256Hex(adminPhone),
            email: encrypt(adminEmail),
            emailHash: sha256Hex(adminEmail),
            password: await hashPassword('hashed_password_123'),
            isOrg: false,
        },
    });

    // Recipient User
    const recipientEmail = 'recipient@gmail.com';
    const recipientPhone = '09172222222';
    const recipient = await prisma.user.upsert({
        where: { emailHash: sha256Hex(recipientEmail) },
        update: {},
        create: {
            firstName: encrypt('Jane'),
            lastName: encrypt('Recipient'),
            phoneNo: encrypt(recipientPhone),
            phoneNoHash: sha256Hex(recipientPhone),
            email: encrypt(recipientEmail),
            emailHash: sha256Hex(recipientEmail),
            password: await hashPassword('hashed_password_123'),
            isOrg: false,
        },
    });

    // Donor User
    const donorEmail = 'donor@gmail.com';
    const donorPhone = '09171111111';
    const donorIndiv = await prisma.user.upsert({
        where: { emailHash: sha256Hex(donorEmail) },
        update: {},
        create: {
            firstName: encrypt('John'),
            lastName: encrypt('Doe'),
            phoneNo: encrypt(donorPhone),
            phoneNoHash: sha256Hex(donorPhone),
            email: encrypt(donorEmail),
            emailHash: sha256Hex(donorEmail),
            password: await hashPassword('hashed_password_123'),
            isOrg: false,
        },
    });

    // 4. Addresses
    console.log('Creating Addresses...');
    await prisma.address.create({
        data: {
            UserID: donorIndiv.userID,
            latitude: 14.5995,
            longitude: 120.9842,
            streetAddress: '123 Rizal St.',
            barangay: 'Barangay 1',
        },
    }).catch(() => { });

    // 5. Food
    console.log('Creating Food items...');
    const food = await prisma.food.create({
        data: {
            userID: donorIndiv.userID,
            foodName: 'Chicken Adobo',
            dateCooked: new Date(),
            description: 'Homemade organic chicken adobo',
            quantity: 50,
            image: 'https://example.com/adobo.jpg',
        },
    });

    // 6. DropOff Location
    console.log('Creating Drop-off Locations...');
    const location = await prisma.dropOffLocation.create({
        data: {
            userID: admin.userID,
            foodID: food.foodID,
            latitude: 14.6,
            longitude: 121.0,
            streetAddress: 'Community Center',
            barangay: 'Barangay Hall',
        },
    });

    // 7. Distribution
    console.log('Creating Distribution...');
    const distribution = await prisma.distribution.upsert({
        where: { disID: "11111111-1111-1111-1111-111111111111" },
        update: {},
        create: {
            disID: "11111111-1111-1111-1111-111111111111",
            donorID: donorIndiv.userID,
            recipientID: recipient.userID,
            locID: location.locID,
            foodID: food.foodID,
            quantity: 5,
            scheduledTime: new Date(new Date().getTime() + 86400000), // Tomorrow
            photoProof: 'https://example.com/proof.jpg',
        },
    });

    // 8. Feedback
    console.log('Creating Feedback...');
    await prisma.feedback.create({
        data: {
            donorID: donorIndiv.userID,
            recipientID: recipient.userID,
            disID: distribution.disID,
            ratingScore: 5,
            comments: 'Thank you for the delicious meal!',
        },
    });

    console.log('✅ Seeding completed with encryption/hashing.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
