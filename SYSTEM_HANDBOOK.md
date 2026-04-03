# KusinaKonek System Handbook

Last updated: 2026-04-03

## 1. Purpose of This Document

This file is a single, consolidated reference for:

1. How to use the app as a donor and recipient.
2. How the backend and mobile system functions work.
3. How data flows across screens, APIs, database, notifications, and schedulers.
4. How to run, maintain, and troubleshoot the system.

If you are onboarding, start with Sections 2, 3, and 11.

## 2. Product Overview

KusinaKonek is a food redistribution platform with two roles:

1. DONOR: creates food donations and tracks claims.
2. RECIPIENT: browses nearby food and claims available donations.

Core outcomes:

1. Reduce food waste.
2. Connect nearby people with available food quickly.
3. Track donation lifecycle from posting to completion.

## 3. How to Use the App

### 3.1 Authentication and Account Setup

1. Open app.
2. If not logged in, app redirects to auth flow.
3. Sign up with email, password, full name, barangay, phone, and role.
4. Verify OTP.
5. Profile is created/updated in backend.
6. User is redirected to main tabs.

Notes:

1. Login requires role selection (DONOR or RECIPIENT).
2. Role can be changed later (PATCH /users/role).
3. App stores selected role in AsyncStorage and also sends role in X-User-Role header.

### 3.2 Donor Main Flow

1. Go to Donor Home.
2. Tap Donate Food.
3. Donation Step 1: choose preset food or custom.
4. Donation Step 2: enter food details, servings, duration, and required photo.
5. Donation Step 3: choose barangay hall or custom map location.
6. Submit donation.
7. Backend creates:
   - Food record
   - Drop-off location
   - Distribution record in PENDING status
8. Nearby recipients are notified.
9. Donor monitors status transitions and chats with recipient.
10. Donor can cancel while still claimable.

### 3.3 Recipient Main Flow

1. Go to Recipient Home.
2. Browse available food (list + map).
3. Add selected items to cart.
4. Cart keeps a local 15-minute reservation window.
5. Tap pickup/claim for cart items.
6. Backend updates distribution to CLAIMED and sets recipient.
7. Recipient can mark ON_THE_WAY.
8. Recipient confirms receipt (COMPLETED).
9. Recipient submits feedback (rating/comments/photo optional).

### 3.4 Chat and Notifications

1. Chat is per distribution.
2. System auto-injects bot starter messages when a claim starts.
3. Unread counts are tracked and displayed in dashboard cards.
4. Push notifications are sent via Firebase FCM token.
5. Notification tap deep-links to tabs or chat screen based on type.

### 3.5 Profile and Account Controls

1. Edit profile updates encrypted user fields.
2. Switch role updates backend roleID and local role state.
3. Notification preference can disable push token sync.
4. Delete account removes user data and attempts Supabase Auth deletion.

## 4. Monorepo and Folder Responsibilities

## 4.1 Root Workspace

1. npm workspaces are used.
2. Root scripts orchestrate server, mobile, and database actions.
3. Root .env is the shared environment source.

## 4.2 apps/mobile

1. Expo Router routes under app/.
2. Context providers under context/.
3. API client, hooks, components, and feature modules under src/.

## 4.3 apps/server

1. Express API entry in src/server.ts and src/app.ts.
2. Route -> Controller -> Service -> Repository layering.
3. Schedulers for claim automation, expiry, and inactivity.

## 4.4 packages/common

1. Shared zod schemas.
2. Shared types.
3. Used by mobile and server for contract consistency.

## 4.5 packages/database

1. Prisma schema and migration source.
2. Exports prisma client and supabaseAdmin client.

## 5. Mobile Runtime Architecture

## 5.1 Provider Stack

Root provider chain:

1. NetworkProvider
2. ThemeProvider
3. AlertProvider
4. AuthProvider
5. PresenceProvider
6. NotificationProvider
7. FoodCacheProvider
8. CartProvider

## 5.2 Route Map

Top level:

1. app/index.tsx: splash + auth gate.
2. app/(auth)/*: onboarding and password recovery.
3. app/(tabs)/*: primary shell.
4. app/(donor)/*: donor-specific flows.
5. app/(recipient)/*: recipient-specific flows.
6. app/(cart)/*: cart stack.

Main auth screens:

1. welcome
2. login
3. signup
4. verify
5. forgot-password
6. reset-verification
7. new-password

Main donor screens:

1. index (dashboard)
2. donate/index
3. donate/details
4. donate/location
5. active-details
6. all-recent-donations
7. chat
8. feedback
9. review-details

Main recipient screens:

1. browse-food
2. food-map
3. all-recent-foods
4. active-details
5. food-details
6. chat
7. track/[disID]

Tabs:

1. index: role-based home (DonorHome or RecipientHome)
2. action: donor floating donation action
3. my-cart: recipient-only cart tab
4. profile
5. edit-profile (hidden)
6. notifications (hidden)

## 5.3 Key Mobile Contexts

AuthContext:

1. Supabase session handling.
2. Sign in, sign out, sign up, OTP verification.
3. Role persistence in AsyncStorage.
4. Post-login prefetch of profile/dashboard cache.

FoodCacheContext:

1. Caches browse-food distributions.
2. Supports location-based fetch.
3. Auto-refresh on timer, reconnect, and app foreground.

CartContext:

1. Local cart with 15-minute per-item reservation window.
2. Batch claim through POST /distributions/:id/request.
3. Handles unavailable items and dashboard refresh events.

NotificationContext:

1. Registers native device push token.
2. Syncs token + location to /users/push-token.
3. Silent dashboard refresh on key notification types.

PresenceContext:

1. Tracks global user online state via Supabase presence channel.
2. Heartbeat updates every 30 seconds.

NetworkContext:

1. Tracks online/offline and slow network state.
2. Exposes reconnection event for auto-refresh.

ThemeContext:

1. Light/dark mode in AsyncStorage.

## 5.4 Key Mobile Hooks

usePushNotifications:

1. Listens for notification response events.
2. Routes user to tabs/chat based on notification type.

useRealtimeMessages:

1. Loads messages by distribution.
2. Uses Supabase broadcast channel for realtime sync.
3. Falls back to polling on realtime failure.
4. Supports optimistic text/image sends.
5. Marks unread messages as read when chat is viewed.

## 6. Backend Runtime Architecture

## 6.1 Request Pipeline

1. Express app with helmet, cors, json parser, morgan.
2. /api responses force no-cache headers.
3. authMiddleware verifies bearer token and role context.
4. validateRequest applies zod schema validation.
5. Controllers delegate to services.
6. Services apply business rules and orchestrate repositories.
7. errorHandler converts known errors to structured HTTP responses.

## 6.2 Authentication and Role Handling

1. Auth uses Supabase Auth as identity source.
2. userID alignment is maintained between Supabase user id and Prisma user.userID.
3. Middleware checks X-User-Role header first, then JWT metadata role.
4. This allows client role switching without waiting for token metadata refresh.

## 6.3 Service Responsibilities

authService:

1. signUp: creates Supabase user and Prisma user profile fields.
2. signIn: signs in with Supabase, updates metadata role, sets login activity.
3. refreshToken, resetPassword, resendVerification, availability checks.

userService:

1. getProfile with decrypted fields.
2. completeProfile upsert with encrypted PII and hashed lookup fields.
3. updatePushToken and optional live coordinates.
4. switchRole and deleteAccount cascade behavior.

foodService:

1. create/list/update/delete food and donation variants.
2. createDonation also creates drop-off location + distribution PENDING.
3. requestDonation and confirmDonation transition claims.
4. cancelDonation enforces status rules and cleanup.

distributionService:

1. create/update/list distributions.
2. listAvailable supports location sorting and excludes own donor items.
3. requestDistribution enforces role and claim limit rules.
4. markOnTheWay and completeDistribution control delivery lifecycle.

messageService:

1. participant authorization.
2. text/image send support with upload service for image messages.
3. unread counting and read state.
4. edit/delete allowed within 2 minutes by sender only.

feedbackService:

1. recipient-only feedback creation.
2. donor averageRating recalculation on submission.
3. donor notification when feedback is received.

notificationService:

1. in-app notification persistence.
2. FCM push send and token validation.
3. recipient broadcast and nearby-recipient targeting.
4. ban notification deletion protection until ban period ends.

claimAutomationService:

1. warning + timeout + ban flow for stale CLAIMED entries.
2. ON_THE_WAY receive reminder and auto-receive fallback.
3. daily feedback reminders until feedback exists.

dashboardService:

1. donor and recipient stat aggregations.
2. empty profile fallback responses.

locationService:

1. create/list/update/delete drop-off locations.
2. ownership checks and linked food constraints.

## 7. API Endpoint Catalog

All routes are under /api.

## 7.1 Auth

1. POST /auth/signup
2. POST /auth/login
3. POST /auth/forgot-password
4. POST /auth/refresh
5. POST /auth/resend-verification
6. POST /auth/availability
7. POST /auth/logout
8. GET /auth/me
9. POST /auth/reset-password

## 7.2 Users

1. GET /users/profile
2. PUT /users/profile
3. PATCH /users/role
4. PUT /users/push-token
5. DELETE /users/account

## 7.3 Foods

1. GET /foods/mine
2. POST /foods/donations
3. GET /foods/donations
4. POST /foods/donations/request
5. GET /foods/donations/user/:userID
6. GET /foods/donations/:foodID
7. PUT /foods/donations/:foodID
8. PATCH /foods/donations/:foodID
9. DELETE /foods/donations/:foodID
10. POST /foods/donations/:foodID/cancel
11. POST /foods/donations/:foodID/confirm
12. GET /foods/:foodID

## 7.4 Locations

1. POST /locations
2. GET /locations/mine
3. GET /locations/food/:foodID
4. PATCH /locations/:locID
5. DELETE /locations/:locID

## 7.5 Distributions

1. GET /distributions/available
2. POST /distributions
3. GET /distributions
4. GET /distributions/mine
5. GET /distributions/claim-limits
6. GET /distributions/:disID
7. PATCH /distributions/:disID
8. PATCH /distributions/:disID/status
9. POST /distributions/:disID/complete
10. POST /distributions/:disID/request
11. POST /distributions/:disID/on-the-way

## 7.6 Feedback

1. POST /feedback
2. GET /feedback/distribution/:disID
3. PUT /feedback/:feedbackID
4. GET /feedback/received

## 7.7 Messages

1. POST /messages
2. GET /messages/distribution/:disID
3. PATCH /messages/:messageID/read
4. GET /messages/distribution/:disID/unread-count
5. DELETE /messages/:messageID
6. PATCH /messages/:messageID

## 7.8 Notifications

1. GET /notifications
2. PUT /notifications/:id/read
3. DELETE /notifications/:id
4. POST /notifications/test

## 7.9 Dashboard

1. GET /dashboard/donor
2. GET /dashboard/recipient
3. GET /dashboard/browse

## 8. Business Rules and Lifecycle Logic

## 8.1 Profile Requirement

Most service operations require an existing profile. If missing, service throws guidance to complete profile first.

## 8.2 Distribution Status Lifecycle

Canonical statuses:

1. PENDING
2. CLAIMED
3. ON_THE_WAY
4. DELIVERED
5. COMPLETED

Common transitions:

1. Donor submits donation -> PENDING.
2. Recipient claims -> CLAIMED.
3. Recipient marks on way -> ON_THE_WAY.
4. Recipient/donor completes -> COMPLETED.

## 8.3 Claim Limits and Restrictions

Recipient claim quotas:

1. Daily max: 1
2. Weekly max: 3
3. Monthly max: 5

Ban logic:

1. If CLAIMED remains without ON_THE_WAY for 4 hours, claim is auto-cancelled.
2. Recipient receives 3-day claim restriction.
3. Restriction communicated in-app, push, and optional email.

## 8.4 Messaging Restrictions

1. Only donor/recipient participants can access distribution chat.
2. Sender can edit/delete own message only within 2 minutes.
3. IMAGE messages cannot be edited as text.

## 8.5 Feedback Rules

1. Only recipient of a distribution can submit feedback.
2. Donor can view received feedback.
3. Donor rating aggregate is recalculated after feedback creation.

## 8.6 Notification Retention Rule

CLAIM_BAN notifications cannot be deleted by user while ban is still active.

## 9. Background Automation and Schedulers

## 9.1 Claim Automation Scheduler

Runs every 5 minutes:

1. Warn recipient 1 hour before claim timeout (at 3-hour mark).
2. Timeout stale CLAIMED after 4 hours.
3. Reopen timed-out distributions to PENDING.
4. Apply 3-day claim ban to timed-out recipient.
5. For ON_THE_WAY:
   - Send receive reminder after 1 hour.
   - Auto-mark completed 30 minutes after reminder if still unconfirmed.
6. For COMPLETED without feedback:
   - Send daily reminder until feedback submitted.

## 9.2 Food Expiry Scheduler

Runs every 1 minute (log text still says 5 min):

1. Checks pending distributions where food is expired.
2. Deletes dependent chat/feedback/notifications.
3. Deletes distribution and food/location if orphaned.
4. Notifies donor that food expired.

## 9.3 Inactivity Scheduler

Runs every 24 hours:

1. Marks users inactive if lastLoginAt is older than 30 days.
2. Also runs once at startup.

## 9.4 Auto-Revert Scheduler (Defined, Not Started)

Code exists to revert ON_THE_WAY after 3 hours, but startup currently does not invoke it (commented out in server startup).

## 10. Data Model Summary

Main Prisma models:

1. Role
2. Status
3. User
4. Address
5. Food
6. DropOffLocation
7. Distribution
8. Feedback
9. Notification
10. Message

Important field patterns:

1. User PII is stored encrypted.
2. emailHash and phoneNoHash are used for lookups/uniqueness.
3. Distribution links donor + optional recipient + food + location.
4. Notification supports generic type and entityID linking.

## 11. Development Setup and Commands

## 11.1 Prerequisites

1. Node.js 20.x (recommended)
2. npm
3. Expo tooling for mobile
4. Supabase project credentials
5. PostgreSQL URL (Supabase or compatible)

## 11.2 Install

From root:

1. npm ci
2. npm run db:generate
3. npm run db:migrate
4. npm run db:seed (optional)

## 11.3 Run

From root:

1. npm run dev:server
2. npm run dev:mobile

## 11.4 Core Root Scripts

1. dev
2. dev:server
3. dev:mobile
4. typecheck
5. db:generate
6. db:migrate
7. db:push
8. db:studio
9. db:seed

## 11.5 Environment Variables (Core)

Server:

1. PORT
2. CORS_ORIGIN
3. SUPABASE_URL
4. SUPABASE_ANON_KEY
5. SUPABASE_SERVICE_ROLE_KEY
6. DATABASE_URL
7. DIRECT_URL
8. JWT_SECRET
9. ENCRYPTION_KEY

Mobile:

1. EXPO_PUBLIC_API_HOST
2. EXPO_PUBLIC_API_PORT
3. EXPO_PUBLIC_API_URL (for production)

Push/Email optional operations:

1. FIREBASE_PROJECT_ID
2. FIREBASE_CLIENT_EMAIL
3. FIREBASE_PRIVATE_KEY
4. GMAIL_USER
5. GMAIL_APP_PASSWORD

## 12. Operations and Utility Scripts

## 12.1 Root Scripts Folder

open-firewall.ps1:

1. Opens Windows firewall for backend port.
2. Needed for physical device access on same Wi-Fi.

setup-dev-env.ps1 and setup-dev-env.sh:

1. Detect local IP.
2. Update root env values for mobile API host/port.
3. Writes apps/mobile/.env for Expo runtime.

prisma-clean-generate.ps1:

1. Stops node-related processes.
2. Cleans prisma artifacts.
3. Regenerates prisma client.

## 12.2 Server Script Utilities

src/scripts/wipeData.ts:

1. Clears transactional tables.
2. Optional --users also clears users/addresses.

src/scripts/deleteUnclaimedFood.ts:

1. Lists pending unclaimed distributions.
2. Deletes when run with --delete.

src/scripts/backfillClaimedBotMessages.ts:

1. Ensures claimed distributions have bot starter messages.
2. Supports --dry-run and --force.

src/scripts/notifyApkUpdate.ts:

1. Sends styled APK update email to all Supabase Auth users.
2. Uses nodemailer + Gmail app password.

src/scripts/benchmark.ts:

1. Mock payload benchmark helper scaffold.

## 12.3 Additional Helper Scripts

check-tokens.ts:

1. Prints users and push token presence.

apps/server/enable-realtime.ts:

1. Adds Message table to supabase_realtime publication.

apps/server/disable-rls.ts:

1. Disables Message table RLS for troubleshooting.

tmp/verify_pem.ts:

1. Validates formatting of FIREBASE_PRIVATE_KEY env value.

## 13. Security and Data Protection

1. PII fields are encrypted before persistence.
2. Sensitive lookup keys use SHA-256 hashing.
3. Passwords are bcrypt-hashed.
4. Auth is bearer token-based via Supabase.
5. Validation is centralized with zod schemas.
6. API disables caching for freshness of stateful data.

## 14. Troubleshooting Quick Reference

Auth/login problems:

1. Check Supabase keys and JWT secret in env.
2. Confirm token is attached in Authorization header.
3. Confirm X-User-Role if role switching looks stale.

Mobile cannot reach backend:

1. Verify EXPO_PUBLIC_API_HOST and EXPO_PUBLIC_API_PORT.
2. Open firewall on Windows.
3. Confirm phone and dev machine are on same network.

Notifications not appearing:

1. Verify Firebase env vars.
2. Confirm physical device is used.
3. Confirm /users/push-token sync succeeds.
4. Use POST /api/notifications/test.

Claims not moving status:

1. Check claim limit endpoint /distributions/claim-limits.
2. Inspect claim automation scheduler logs.
3. Verify distribution current status before transition.

Realtime chat inconsistency:

1. Confirm Message table in supabase_realtime publication.
2. Check Supabase channel subscription status.
3. Polling fallback should activate on channel error.

## 15. Recommended Reading Order for New Team Members

1. Root README.md
2. ENVIRONMENT_MIGRATION.md
3. apps/mobile/README.md
4. apps/server/README.md
5. This handbook

## 16. Notes on Accuracy

This handbook reflects current implementation behavior in the codebase as of the last updated date. If behavior changes, update this file alongside code changes so it remains the single source of truth.
