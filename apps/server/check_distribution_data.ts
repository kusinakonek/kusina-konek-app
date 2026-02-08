import 'dotenv/config';
import { prisma } from "@kusinakonek/database";

async function checkData() {
    console.log("\n=== Checking Database ===\n");

    // Check Food table
    const foodCount = await prisma.food.count();
    console.log(`Total Food records: ${foodCount}`);
    
    if (foodCount > 0) {
        const foods = await prisma.food.findMany({ take: 3 });
        console.log("Sample foods:", foods.map(f => ({ 
            id: f.foodID, 
            name: f.foodName, 
            quantity: f.quantity 
        })));
    }

    // Check Distribution table
    const distCount = await prisma.distribution.count();
    console.log(`\nTotal Distribution records: ${distCount}`);
    
    if (distCount > 0) {
        const distributions = await prisma.distribution.findMany({ 
            take: 5,
            include: {
                food: true,
                location: true
            }
        });
        console.log("\nSample distributions:");
        distributions.forEach(d => {
            console.log({
                id: d.disID,
                foodName: d.food.foodName,
                status: d.status,
                recipientID: d.recipientID,
                quantity: d.quantity
            });
        });
    }

    // Check PENDING distributions
    const pendingCount = await prisma.distribution.count({
        where: {
            status: "PENDING",
            recipientID: null
        }
    });
    console.log(`\nAvailable (PENDING & unclaimed) distributions: ${pendingCount}`);

    await prisma.$disconnect();
}

checkData().catch(console.error);
