# KusinaKonek Monorepo-lite

Community-driven food redistribution mobile app.

## Structure
- **apps/mobile**: Expo React Native app (Android-first)
- **apps/server**: ExpressJS API with strict MVC (TypeScript)
- **packages/common**: Shared types + Zod validation schemas
- **packages/database**: Prisma + Supabase client

## Quick Start
1. Install dependencies:
   - `npm install`
2. Generate Prisma client:
   - `npm run db:generate`
3. Run server:
   - `npm run dev:server`
4. Run mobile:
   - `npm run dev:mobile`

## Environment
Copy `.env.example` to `.env` and fill values.
