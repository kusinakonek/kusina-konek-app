
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTokens() {
    const users = await prisma.user.findMany({
        select: {
            userID: true,
            pushToken: true,
            role: { select: { roleName: true } }
        }
    });

    console.log(`Total users: ${users.length}`);
    users.forEach(u => {
        console.log(`User: ${u.userID}, Role: ${u.role?.roleName}, Token: ${u.pushToken || 'NULL'}`);
    });

    await prisma.$disconnect();
}

checkTokens().catch(e => {
    console.error(e);
    process.exit(1);
});
