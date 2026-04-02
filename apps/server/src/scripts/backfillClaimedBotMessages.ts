require('dotenv').config({ path: '../../.env' });

import { prisma } from '@kusinakonek/database';
import { safeDecrypt } from '../utils/encryption';

const BOT_PREFIX = '[KusinaKonek Bot]';

function donorStarterMessage(recipientName: string, foodName: string): string {
  return `${BOT_PREFIX} ${recipientName}, has claimed your food ${foodName}. Start a conversation to coordinate pickup details.`;
}

function recipientStarterMessage(foodName: string): string {
  return `${BOT_PREFIX} Congrats on the fresh food! You got ${foodName}. Start a conversation with the donor for pickup coordination.`;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isForce = process.argv.includes('--force');

  console.log(isDryRun
    ? '🔎 Dry-run: scanning CLAIMED transactions and simulating bot message backfill...'
    : '🤖 Backfilling KusinaKonek bot messages for CLAIMED transactions...');

  if (isForce) {
    console.log('⚠️  Force mode enabled: sending a fresh donor+recipient bot message pair for every CLAIMED transaction.');
  }

  const claimedDistributions = await prisma.distribution.findMany({
    where: {
      status: 'CLAIMED',
      recipientID: { not: null },
    },
    select: {
      disID: true,
      donorID: true,
      recipientID: true,
      food: {
        select: {
          foodName: true,
        },
      },
      recipient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      messages: {
        select: {
          senderID: true,
          content: true,
        },
      },
    },
  });

  if (claimedDistributions.length === 0) {
    console.log('✅ No CLAIMED distributions found. Nothing to backfill.');
    return;
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const dist of claimedDistributions) {
    if (!dist.recipientID) {
      skippedCount += 1;
      continue;
    }

    const foodName = safeDecrypt(dist.food?.foodName) || 'this food donation';
    const recipientName =
      [safeDecrypt(dist.recipient?.firstName), safeDecrypt(dist.recipient?.lastName)]
        .filter(Boolean)
        .join(' ')
        .trim() || 'A recipient';

    const donorMessage = donorStarterMessage(recipientName, foodName);
    const recipientMessage = recipientStarterMessage(foodName);

    const hasDonorSideMessage = !isForce && dist.messages.some(
      (m) => m.senderID === dist.recipientID && m.content === donorMessage,
    );

    const hasRecipientSideMessage = !isForce && dist.messages.some(
      (m) => m.senderID === dist.donorID && m.content === recipientMessage,
    );

    if (!hasDonorSideMessage) {
      if (!isDryRun) {
        await prisma.message.create({
          data: {
            disID: dist.disID,
            senderID: dist.recipientID,
            messageType: 'TEXT',
            content: donorMessage,
          },
        });
      }
      insertedCount += 1;
    }

    if (!hasRecipientSideMessage) {
      if (!isDryRun) {
        await prisma.message.create({
          data: {
            disID: dist.disID,
            senderID: dist.donorID,
            messageType: 'TEXT',
            content: recipientMessage,
          },
        });
      }
      insertedCount += 1;
    }

    if (hasDonorSideMessage && hasRecipientSideMessage) {
      skippedCount += 1;
      continue;
    }

    console.log(
      `${isDryRun ? '🧪 Would backfill' : '✅ Backfilled'} disID=${dist.disID} ` +
      `(donorMsg=${hasDonorSideMessage ? 'exists' : 'added'}, recipientMsg=${hasRecipientSideMessage ? 'exists' : 'added'})`,
    );
  }

  console.log('\n📊 Summary');
  console.log(`- CLAIMED distributions scanned: ${claimedDistributions.length}`);
  console.log(`- Messages ${isDryRun ? 'to insert' : 'inserted'}: ${insertedCount}`);
  console.log(`- Fully up-to-date transactions skipped: ${skippedCount}`);
  if (isForce) {
    console.log('- Mode: force (fresh bot message pair sent per CLAIMED transaction)');
  }
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e?.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
