# KusinaKonek Monorepo-lite

Community-driven food redistribution mobile app.

## Overview
KusinaKonek is organized as a monorepo-lite using npm workspaces. It contains a mobile client (Expo) and a backend API (ExpressJS) with shared packages for types, validation, and database access.

## Workspace + Hoisted Dependencies
This repo uses npm workspaces, which hoist shared dependencies to the root node_modules. Both apps still declare their own dependencies in their respective package.json files, but npm de-duplicates and stores common versions at the root for faster installs and consistent versions.

What this means in practice:
- apps/mobile and apps/server resolve dependencies from the root node_modules.
- Each app keeps its own dependency list and can still have package-specific node_modules when needed.
- Do not delete the root package.json or package-lock.json; they manage workspace linking and hoisting.

## Structure
- apps/mobile: Expo React Native app (Android-first)
- apps/server: ExpressJS API with strict MVC (TypeScript)
- packages/common: Shared types + Zod validation schemas
- packages/database: Prisma + Supabase client
- .github: CI workflow and branch protection guidance

## Architecture
### Backend (ExpressJS MVC)
- Controllers handle HTTP requests and responses.
- Services implement business logic and call Supabase + Prisma.
- Routes map endpoints to controllers.
- Middlewares handle validation and error handling.

### Database + Auth (Supabase + Prisma)
- Supabase handles authentication.
- Prisma connects to Supabase Postgres for relational data.
- Shared models are defined in packages/database/prisma/schema.prisma.

### Mobile (Expo)
- Android-first Expo app with permissions configured in app.json.
- Maps and location support via Expo modules.

## Core Features Map
1. Authentication
   - Secure login/sign-up
   - Role-based access: Donor, Recipient, Volunteer
2. Inventory & Media
   - Real-time food lists
   - Photo proof for donations
3. Geolocation
   - Donor/recipient map visualization
   - Route optimization support
4. Food Safety
   - Expiry tracking
   - Automated alerts

## Quick Start
### Prerequisites
- Node.js: use the version in `.nvmrc` (Node 20 LTS recommended)
- npm: use the repo root `package-lock.json` for reproducible installs

### Install
1. Install dependencies (recommended)
   - npm ci

   Or (local dev when changing deps)
   - npm install
2. Generate Prisma client
   - npm run db:generate
3. Run server
   - npm run dev:server
4. Run mobile
   - npm run dev:mobile

### Common Workspace Commands
- Run mobile tests: `npm -w apps/mobile test`
- Run server typecheck: `npm run typecheck`

## Environment
Copy .env.example to .env and fill values.

Required variables:
- PORT
- CORS_ORIGIN
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL
- JWT_SECRET

## Branching Strategy
- main: production-ready
- develop: integration branch
- feature/*: feature work

## CI
GitHub Actions workflow lives under .github/workflows/ci.yml.
