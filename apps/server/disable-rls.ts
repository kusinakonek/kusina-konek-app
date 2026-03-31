import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Attempting to disable Row-Level Security explicitly for the Message table...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;`);
    console.log("✅ Success! RLS dropped. WebSockets will now stream flawlessly to unauthenticated anonymous connections.");
  } catch (e: any) {
    if (e.message && e.message.includes('does not exist')) {
      console.log("Table doesn't exist? Check schema.");
    } else {
      console.error("❌ Failed to alter table:", e);
    }
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
