require('dotenv').config({ path: '../../.env' });
import { prisma } from '@kusinakonek/database';

async function main() {
    // Find all unclaimed food distributions
    // Unclaimed = status PENDING and no recipient (recipientID is null)
    
    console.log('🔍 Scanning for unclaimed food...\n');
    
    const unclaimedDistributions = await prisma.distribution.findMany({
        where: {
            status: 'PENDING',
            recipientID: null
        },
        include: {
            food: {
                include: {
                    user: {
                        select: {
                            userID: true,
                            firstName: true,
                            lastName: true,
                            orgName: true
                        }
                    }
                }
            },
            donor: {
                select: {
                    firstName: true,
                    lastName: true,
                    orgName: true
                }
            },
            location: true
        },
        orderBy: { timestamp: 'desc' }
    });

    if (unclaimedDistributions.length === 0) {
        console.log('✅ No unclaimed food found!');
        return;
    }

    console.log(`📦 Found ${unclaimedDistributions.length} unclaimed food item(s):\n`);
    
    unclaimedDistributions.forEach((dist, idx) => {
        const donorName = dist.donor.orgName || `${dist.donor.firstName} ${dist.donor.lastName}`;
        const foodName = dist.food.foodName;
        const quantity = dist.quantity;
        const uploadedAt = dist.timestamp ? new Date(dist.timestamp).toLocaleString() : 'N/A';
        
        console.log(`${idx + 1}. "${foodName}" (${quantity})`);
        console.log(`   From: ${donorName}`);
        console.log(`   Distribution ID: ${dist.disID}`);
        console.log(`   Food ID: ${dist.foodID}`);
        console.log(`   Uploaded: ${uploadedAt}`);
        console.log(`   Location: ${dist.location.streetAddress}, ${dist.location.barangay || 'N/A'}`);
        console.log('');
    });

    console.log(`⚠️  Ready to delete ${unclaimedDistributions.length} unclaimed food item(s).`);
    console.log('Run with DELETE=true to actually delete: node deleteUnclaimedFood.ts --delete\n');

    // Only delete if --delete flag is passed
    const shouldDelete = process.argv.includes('--delete');
    
    if (shouldDelete) {
        console.log('🗑️  Deleting unclaimed food...\n');
        
        const foodIdsToDelete = unclaimedDistributions.map(d => d.foodID);
        const disIdsToDelete = unclaimedDistributions.map(d => d.disID);
        
        // Delete distributions first (foreign key constraint)
        const deletedDis = await prisma.distribution.deleteMany({
            where: { disID: { in: disIdsToDelete } }
        });
        
        // Then delete food items
        const deletedFood = await prisma.food.deleteMany({
            where: { foodID: { in: foodIdsToDelete } }
        });
        
        console.log(`✅ Deleted ${deletedFood.count} food item(s)`);
        console.log(`✅ Deleted ${deletedDis.count} distribution record(s)`);
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
