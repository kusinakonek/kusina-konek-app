/**
 * APK Update Notification Script (Nodemailer + Gmail)
 * 
 * Sends a styled HTML email to ALL existing Supabase Auth users
 * notifying them about the latest APK download link.
 * 
 * SETUP:
 * 1. Create a Gmail App Password: https://myaccount.google.com/apppasswords
 * 2. Set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file
 * 3. Run: npx ts-node-dev --transpile-only src/scripts/notifyApkUpdate.ts
 */

require('dotenv').config({ path: '../../.env' });

import { createClient } from '@supabase/supabase-js';
const nodemailer = require('nodemailer');

// ─── CONFIG: Edit these values ───────────────────────────────
const APK_LINK = 'https://expo.dev/artifacts/eas/axr8niDkRxGFpn4QNbsATU.apk';
const EMAIL_SUBJECT = '🎉 KusinaKonek New Update Available — Download Now!';
// ─────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const gmailUser = process.env.GMAIL_USER ?? '';
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD ?? '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

if (!gmailUser || !gmailAppPassword) {
  console.error('❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env');
  console.error('   1. Go to https://myaccount.google.com/apppasswords');
  console.error('   2. Generate an App Password for "Mail"');
  console.error('   3. Add to your .env file:');
  console.error('      GMAIL_USER=your-email@gmail.com');
  console.error('      GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },
});

function buildEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 32px; text-align: center;">
              <h1 style="color:#ffffff; margin:0; font-size:24px;">🎉 New Update Available!</h1>
              <p style="color:#E8F5E9; margin:8px 0 0; font-size:14px;">KusinaKonek App</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="color:#333; font-size:16px; line-height:1.6; margin-top:0;">Hi there!</p>
              
              <p style="color:#333; font-size:16px; line-height:1.6;">
                We're excited to let you know that a <strong>new version of KusinaKonek (v2.1.0)</strong> is now available for download!
              </p>

              <p style="color:#333; font-size:16px; line-height:1.6; margin-bottom:12px;">
                <strong>Great news:</strong> KusinaKonek is now much faster and more optimized. You still get the same features, but with less loading and smoother performance.
              </p>

              <h3 style="color:#2E7D32; margin-bottom:8px;">📱 What's New in v2.1.0:</h3>
              <ul style="color:#555; font-size:14px; line-height:1.8;">
                <li><strong>Major Performance Upgrade:</strong> Same complete features, now with faster loading and a smoother app experience.</li>
                <li><strong>Unread Message Badges:</strong> See at a glance which food donations have new messages with count badges on food cards and chat buttons.</li>
                <li><strong>Real-Time Badge Updates:</strong> Message counts update instantly without refreshing - badges disappear the moment you read messages.</li>
                <li><strong>Global Online Status:</strong> Users appear online whenever the app is open or running in the background, not just when viewing chat.</li>
                <li><strong>Message Seen Status:</strong> Know when your messages have been read with clear "Seen" indicators in chat.</li>
                <li><strong>Online/Offline Indicators:</strong> See real-time status of who's online with green/gray dots and "Online/Offline" labels in chat.</li>
                <li><strong>Improved Chat UX:</strong> Messages are automatically marked as read when you view them, keeping your message counts accurate.</li>
                <li><strong>Food Availability Timer:</strong> Donors can now set an exact time limit for how long their food donation will be available before expiring.</li>
                <li><strong>Unclaimed Notifications:</strong> Added automatic notifications to alert donors if their food donation expires without being claimed.</li>
                <li><strong>Responsive Design:</strong> Fixed layout issues to ensure buttons look great on all screen sizes.</li>
                <li><strong>Enhanced Visuals:</strong> Updated app logos, icons, and loading screens for a fresher experience.</li>
                <li><strong>Profile Syncing:</strong> Your role (Donor/Recipient) now syncs instantly when you switch it in your profile.</li>
              </ul>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${APK_LINK}" 
                       style="background-color:#4CAF50; color:#ffffff; padding:14px 32px; 
                              text-decoration:none; border-radius:8px; font-weight:bold; 
                              font-size:16px; display:inline-block;">
                      📥 Download Latest APK
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#777; font-size:13px; text-align:center;">
                Or copy this link:<br>
                <a href="${APK_LINK}" style="color:#4CAF50; word-break:break-all;">${APK_LINK}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f9f9; padding: 20px 32px; border-top: 1px solid #eee;">
              <p style="color:#999; font-size:12px; margin:0; text-align:center;">
                You're receiving this because you have an account on KusinaKonek.<br>
                If you have any questions, feel free to reach out to our team.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function main() {
  console.log('📧 APK Update Notification Script (Nodemailer)');
  console.log('================================================\n');

  // Verify SMTP connection
  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified!\n');
  } catch (err: any) {
    console.error('❌ Gmail SMTP connection failed:', err.message);
    console.error('   Check your GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    process.exit(1);
  }

  // Fetch all users from Supabase Auth
  console.log('Fetching all users from Supabase Auth...\n');

  const allUsers: { id: string; email: string }[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) break;

    for (const user of users) {
      if (user.email) {
        allUsers.push({ id: user.id, email: user.email });
      }
    }

    if (users.length < perPage) break;
    page++;
  }

  console.log(`Found ${allUsers.length} user(s) with email addresses.\n`);

  if (allUsers.length === 0) {
    console.log('No users found. Exiting.');
    return;
  }

  // Send email to each user
  let successCount = 0;
  let failCount = 0;
  const htmlContent = buildEmailHtml();

  for (const user of allUsers) {
    try {
      await transporter.sendMail({
        from: `"KusinaKonek" <${gmailUser}>`,
        to: user.email,
        subject: EMAIL_SUBJECT,
        html: htmlContent,
      });

      console.log(`✅ ${user.email} — Email sent!`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err: any) {
      console.error(`❌ ${user.email} — Failed: ${err.message}`);
      failCount++;
    }
  }

  console.log('\n================================================');
  console.log('📊 Results:');
  console.log(`   ✅ Sent: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📧 Total users: ${allUsers.length}`);
  console.log('================================================\n');
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  });
