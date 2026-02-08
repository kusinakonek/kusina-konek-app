import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('STARTING CHECK...');
    try {
        const count = await prisma.distribution.count({
            where: {
                recipientID: null,
                actualTime: null
            }
        });
        console.log('COUNT:', count);

        const items = await prisma.distribution.findMany({
            where: { recipientID: null },
            include: { food: true },
            take: 5
        });
        console.log('ITEMS:', JSON.stringify(items, null, 2));

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
        console.log('DONE');
    }
}

main();
