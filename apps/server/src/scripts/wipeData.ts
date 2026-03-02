require('dotenv').config({ path: '../../.env' });
import { prisma } from '@kusinakonek/database';

async function main() {
    const wipeUsers = process.argv.includes('--users') || process.argv.includes('-u');

    if (wipeUsers) {
        console.log('Wiping ALL data (including Users and Addresses)...');
    } else {
        console.log('Wiping transactional data (keeping Users, Roles, Statuses, and Addresses)...');
    }

    // Order matters for foreign key constraints
    await prisma.feedback.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.distribution.deleteMany({});
    await prisma.dropOffLocation.deleteMany({});
    await prisma.food.deleteMany({});

    if (wipeUsers) {
        // Address depends on User
        await prisma.address.deleteMany({});
        await prisma.user.deleteMany({});
        console.log('✅ All data (including Users and Addresses) wiped successfully.');
    } else {
        console.log('✅ Transactional data wiped successfully.');
    }
}

main()
    .catch((e) => {
        console.error('Failed to wipe data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
