require('dotenv').config({ path: '../../.env' });
import { prisma } from '@kusinakonek/database';

async function main() {
    console.log('Wiping transactional data (keeping Users, Roles, Statuses, and Addresses)...');

    // Order matters for foreign key constraints
    await prisma.feedback.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.distribution.deleteMany({});
    await prisma.dropOffLocation.deleteMany({});
    await prisma.food.deleteMany({});

    console.log('✅ Transactional data wiped successfully.');
}

main()
    .catch((e) => {
        console.error('Failed to wipe data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
