import { prisma } from '@kusinakonek/database';
import * as crypto from 'crypto';


// Helper to hash details (simplified for seeding)
const hash = (str: string) => crypto.createHash('sha256').update(str).digest('hex');

async function main() {
    console.log('🌱 Starting Seeding...');

    // 1. Roles
    console.log('Creating Roles...');
    const roleAdmin = await prisma.role.upsert({
        where: { roleName: 'ADMIN' },
        update: {},
        create: { roleName: 'ADMIN' },
    });
    const roleDonor = await prisma.role.upsert({
        where: { roleName: 'DONOR' },
        update: {},
        create: { roleName: 'DONOR' },
    });
    const roleRecipient = await prisma.role.upsert({
        where: { roleName: 'RECIPIENT' },
        update: {},
        create: { roleName: 'RECIPIENT' },
    });
    const roleVolunteer = await prisma.role.upsert({
        where: { roleName: 'VOLUNTEER' },
        update: {},
        create: { roleName: 'VOLUNTEER' },
    });

    // 2. Statuses
    console.log('Creating Statuses...');
    const statuses = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    for (const statusName of statuses) {
        await prisma.status.upsert({
            where: { statusName },
            update: {},
            create: { statusName },
        });
    }

    // 3. Users
    console.log('Creating Users...');

    // Admin
    const admin = await prisma.user.upsert({
        where: { emailHash: hash('admin@kusinakonek.com') },
        update: {},
        create: {
            roleID: roleAdmin.roleID,
            firstName: 'Admin',
            lastName: 'User',
            phoneNo: '09170000000',
            phoneNoHash: hash('09170000000'),
            email: 'admin@kusinakonek.com',
            emailHash: hash('admin@kusinakonek.com'),
            password: 'hashed_password_123', // In real app, use bcrypt
            isOrg: false,
        },
    });

    // Donor (Individual)
    const donorIndiv = await prisma.user.upsert({
        where: { emailHash: hash('donor@example.com') },
        update: {},
        create: {
            roleID: roleDonor.roleID,
            firstName: 'John',
            lastName: 'Doe',
            phoneNo: '09171111111',
            phoneNoHash: hash('09171111111'),
            email: 'donor@example.com',
            emailHash: hash('donor@example.com'),
            password: 'hashed_password_123',
            isOrg: false,
        },
    });

    // Donor (Organization)
    const donorOrg = await prisma.user.upsert({
        where: { emailHash: hash('contact@acmefoundation.org') },
        update: {},
        create: {
            roleID: roleDonor.roleID,
            firstName: 'Acme',
            lastName: 'Foundation',
            orgName: 'Acme Foundation Inc.',
            phoneNo: '09172222222',
            phoneNoHash: hash('09172222222'),
            email: 'contact@acmefoundation.org',
            emailHash: hash('contact@acmefoundation.org'),
            password: 'hashed_password_123',
            isOrg: true,
        },
    });

    // Recipient
    const recipient = await prisma.user.upsert({
        where: { emailHash: hash('recipient@example.com') },
        update: {},
        create: {
            roleID: roleRecipient.roleID,
            firstName: 'Jane',
            lastName: 'Smith',
            phoneNo: '09173333333',
            phoneNoHash: hash('09173333333'),
            email: 'recipient@example.com',
            emailHash: hash('recipient@example.com'),
            password: 'hashed_password_123',
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
    }).catch(() => { }); // Ignore if duplicate

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
            userID: admin.userID, // Managed by admin/LGU
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

    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
