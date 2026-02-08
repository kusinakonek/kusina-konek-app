import { prisma } from "../../packages/database/src/index";

async function main() {
    console.log("Checking Distribution data...");

    const totalDistributions = await prisma.distribution.count();
    console.log("Total distributions:", totalDistributions);

    const availableDistributions = await prisma.distribution.count({
        where: {
            actualTime: null,
        },
    });
    console.log("Available distributions (actualTime: null):", availableDistributions);

    const completedDistributions = await prisma.distribution.count({
        where: {
            actualTime: { not: null },
        },
    });
    console.log("Completed distributions (actualTime: not null):", completedDistributions);

    const allDistributions = await prisma.distribution.findMany({
        select: {
            disID: true,
            status: true,
            actualTime: true,
            scheduledTime: true,
            donorID: true,
            recipientID: true
        }
    });
    console.log("All Distributions details:", JSON.stringify(allDistributions, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
