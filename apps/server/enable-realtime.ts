import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Attempting to enable Supabase Realtime for the Message table...");
    await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Message";`);
    console.log("✅ Success! Realtime is now fully enabled for Chat Messages!");
  } catch (e: any) {
    if (e.message && (e.message.includes('already exists') || e.message.includes('already member'))) {
      console.log("✅ Table is already in the supabase_realtime publication. All good!");
    } else {
      console.error("❌ Failed to enable realtime:", e);
    }
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
