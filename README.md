<p align="center">
  <img src="apps/mobile/assets/KusinaKonek-Logo.png" alt="KusinaKonek Logo" width="120" />
</p>

<h1 align="center">KusinaKonek</h1>

<p align="center">
  <strong>Community-Driven Food Redistribution Platform</strong><br/>
  Connecting food donors with recipients to reduce waste and fight hunger
</p>

<p align="center">
  <img alt="Expo SDK" src="https://img.shields.io/badge/Expo_SDK-53-blue?logo=expo" />
  <img alt="React Native" src="https://img.shields.io/badge/React_Native-0.79-61DAFB?logo=react" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4.x-green?logo=express" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?logo=supabase" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" />
  <img alt="Node" src="https://img.shields.io/badge/Node-20_LTS-339933?logo=node.js" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Mobile App Screens](#mobile-app-screens)
- [API Endpoints](#api-endpoints)
- [Branching Strategy](#branching-strategy)
- [CI / CD](#ci--cd)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**KusinaKonek** (from Filipino — *Kusina* "kitchen" + *Konek* "connect") is a community-driven food redistribution mobile application that bridges the gap between food donors (restaurants, households, organizations) and recipients in need. Built as a monorepo, the project contains a cross-platform **Expo React Native** mobile client and an **Express.js** backend API, supported by **Supabase** for authentication and **PostgreSQL** (via **Prisma ORM**) for data persistence.

The platform enables:
- **Donors** to list surplus food, set drop-off locations on an interactive map, and track donation statuses.
- **Recipients** to browse available food nearby, claim donations, navigate to pickup points, and provide feedback.
- **Real-time notifications** to keep all users informed of claims, pickups, and delivery updates.

---

## Features

### 🍽️ Authentication & User Management
- Secure sign-up and login via Supabase Auth
- Email verification with OTP flow
- Password reset with email verification
- Role-based access control: **Donor** and **Recipient**
- Organization accounts support
- User profile management with editable information

### 🥘 Food Donation Management
- Donors can list available food with name, description, quantity, cooking date, and photo
- Image capture via camera or photo gallery with automatic compression
- Real-time food inventory browsing for recipients
- Search and filter available donations
- Donation history tracking

### 📍 Geolocation & Interactive Maps
- Interactive map for donors to pin drop-off locations
- Recipients can view available food on a map with donor info callouts
- Location-based food proximity sorting
- Turn-by-turn navigation to pickup points via Google Maps integration
- Address geocoding and reverse geocoding

### 🛒 Cart & Claiming System
- Recipients can add multiple food items to a cart
- Claim limit management to ensure fair distribution
- Distribution status tracking: `PENDING` → `CLAIMED` → `ON_THE_WAY` → `DELIVERED` → `COMPLETED`
- Photo proof of delivery

### 🔔 Push Notifications
- Real-time push notifications via Firebase Cloud Messaging (FCM v1)
- In-app notification center with read/unread status
- Claim alerts, delivery updates, and broadcast messages
- Location-based notification targeting

### ⭐ Feedback & Ratings
- Recipients can rate and review donors after receiving food
- Aggregate star ratings on donor profiles
- Photo evidence support in feedback
- Comment system for detailed reviews

### 📊 Dashboard & Analytics
- Donor dashboard with real-time donation statistics
- Recent donations overview
- Active listings management
- Claims and distribution tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Mobile Client** | Expo SDK 53, React Native 0.79, TypeScript |
| **Navigation** | Expo Router (file-based routing) |
| **Maps** | React Native Maps + Google Maps API |
| **Backend API** | Express.js 4.x, TypeScript |
| **ORM** | Prisma 5.x |
| **Database** | PostgreSQL (Supabase-hosted) |
| **Authentication** | Supabase Auth |
| **File Storage** | Supabase Storage |
| **Push Notifications** | Firebase Cloud Messaging (FCM v1) via Expo Notifications |
| **Validation** | Zod (shared schemas) |
| **CI** | GitHub Actions |
| **Build Service** | EAS Build (Expo Application Services) |

---

## Monorepo Structure

This project uses **npm workspaces** to manage a monorepo. Shared dependencies are hoisted to the root `node_modules` for faster installs and consistent versions.

```
kusinakonek/
├── apps/
│   ├── mobile/              # Expo React Native mobile app
│   │   ├── app/             # File-based routes (Expo Router)
│   │   │   ├── (auth)/      #   Auth screens (login, signup, verify, password reset)
│   │   │   ├── (tabs)/      #   Main tab navigator (home, cart, notifications, profile)
│   │   │   ├── (donor)/     #   Donor screens (donate, feedback, review)
│   │   │   ├── (recipient)/ #   Recipient screens (browse food, food map)
│   │   │   └── (cart)/      #   Cart management
│   │   ├── context/         # React Contexts (Auth, Cart, Donation, Notification, Theme, Alert, FoodCache)
│   │   ├── src/
│   │   │   ├── api/         # API client & HTTP helpers
│   │   │   ├── auth/        # Auth UI components & logic
│   │   │   ├── components/  # 30+ reusable UI components
│   │   │   ├── config/      # App configuration (API base URL)
│   │   │   ├── constants/   # App-wide constants
│   │   │   ├── donor/       # Donor-specific screens (Home, AddFood)
│   │   │   ├── hooks/       # Custom hooks (push notifications, etc.)
│   │   │   ├── recipient/   # Recipient-specific screens (Home)
│   │   │   ├── state/       # State management utilities
│   │   │   ├── styles/      # Shared styles & theme
│   │   │   ├── types/       # TypeScript type definitions
│   │   │   └── utils/       # Utilities (image compression, etc.)
│   │   └── lib/             # Supabase client initialization
│   │
│   └── server/              # Express.js backend API
│       └── src/
│           ├── config/      # Server configuration
│           ├── controllers/ # HTTP request handlers
│           ├── middlewares/  # Auth, validation & error middlewares
│           ├── repositories/# Data access layer (Prisma queries)
│           ├── routes/      # Route definitions
│           ├── scripts/     # Utility scripts (data wipe)
│           ├── services/    # Business logic layer
│           └── utils/       # Server utilities
│
├── packages/
│   ├── common/              # Shared code between mobile & server
│   │   └── src/
│   │       ├── schemas/     # Zod validation schemas (auth, food, distribution, etc.)
│   │       └── types/       # Shared TypeScript types
│   │
│   └── database/            # Database package
│       ├── prisma/
│       │   ├── schema.prisma  # Database schema definition
│       │   ├── migrations/    # Database migrations
│       │   └── seed.ts        # Database seeder
│       └── src/               # Prisma & Supabase client exports
│
├── scripts/                 # DevOps & setup scripts
│   ├── setup-dev-env.ps1    # Windows dev environment setup
│   ├── setup-dev-env.sh     # Linux/Mac dev environment setup
│   ├── open-firewall.ps1    # Firewall configuration for mobile dev
│   └── prisma-clean-generate.ps1  # Prisma client regeneration
│
├── .github/                 # CI/CD configuration
│   └── workflows/ci.yml     # GitHub Actions CI pipeline
│
├── package.json             # Root workspace config
├── tsconfig.base.json       # Shared TypeScript configuration
└── .nvmrc                   # Node.js version (20.11.1)
```

---

## Architecture

### Backend — MVC Pattern

The Express.js server follows a strict **Model-View-Controller (MVC)** architecture layered with a repository pattern:

```
Client Request
    │
    ▼
  Routes ──────► Controllers ──────► Services ──────► Repositories ──────► Prisma/Supabase
                  (HTTP layer)      (Business logic)   (Data access)         (Database)
```

- **Routes** — Define API endpoints and apply middleware (auth, validation)
- **Controllers** — Handle HTTP request/response; delegate to services
- **Services** — Implement business logic; orchestrate data access and external calls
- **Repositories** — Pure data-access layer; Prisma queries and Supabase calls
- **Middlewares** — Authentication guards, request validation (Zod), error handling

### Mobile — Feature-Based Architecture

The Expo mobile app uses **file-based routing** (Expo Router) and a **feature-based** source organization:

```
User Interaction
    │
    ▼
  Screens (app/) ──────► Components (src/components/) ──────► API Layer (src/api/)
    │                                                              │
    ▼                                                              ▼
  Contexts (context/) ◄──────────────────────────────────── Express Server
```

- **Screens** — Organized by route groups: `(auth)`, `(tabs)`, `(donor)`, `(recipient)`, `(cart)`
- **Contexts** — Global state management via React Context API for Auth, Cart, Donations, Notifications, Theme, Alerts, and Food Cache
- **Components** — 30+ reusable, componentized UI elements
- **Hooks** — Custom hooks for cross-cutting concerns (push notifications, etc.)

---

## Database Schema

The application uses **PostgreSQL** managed via **Prisma ORM** with the following data models:

```
┌──────────┐       ┌──────────┐       ┌────────────────┐
│   Role   │──────►│   User   │──────►│    Address     │
└──────────┘  1:N  └──────────┘  1:1  └────────────────┘
                        │
              ┌─────────┼─────────────┐
              │         │             │
              ▼         ▼             ▼
         ┌────────┐ ┌──────────────┐ ┌──────────────┐
         │  Food  │ │ Distribution │ │ Notification │
         └────────┘ └──────────────┘ └──────────────┘
              │         │
              ▼         ▼
     ┌───────────────┐ ┌──────────┐
     │DropOffLocation│ │ Feedback │
     └───────────────┘ └──────────┘
```

| Model | Description |
|---|---|
| **User** | Application users with role, contact info, push token, and ratings |
| **Role** | User roles (Donor, Recipient) |
| **Food** | Food donations with name, description, quantity, image, and cooking date |
| **DropOffLocation** | GPS-pinned drop-off points with lat/lng and address |
| **Distribution** | Tracks the lifecycle of a food donation claim (PENDING → COMPLETED) |
| **Feedback** | Ratings and reviews from recipients to donors |
| **Notification** | In-app notifications with read/unread tracking |
| **Address** | User home/default addresses |

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | 20.11.1 LTS | Use `nvm` with the included `.nvmrc` |
| **npm** | 10.x+ | Comes with Node 20 |
| **Expo CLI** | Latest | Installed via `npx expo` |
| **Android Studio** | Latest | For Android emulator (optional) |
| **Expo Go** | Latest | For physical device testing |
| **Supabase Account** | — | For database & auth |
| **Firebase Project** | — | For push notifications (FCM) |

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kusinakonek/kusina-konek-app.git
   cd kusina-konek-app
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```
   > Uses the lockfile for reproducible installs. Use `npm install` only when changing dependencies.

3. **Set up environment variables**
   ```bash
   # Copy and fill in the required values (see Environment Variables section)
   cp .env.example .env
   ```

4. **Generate Prisma client**
   ```bash
   npm run db:generate
   ```

5. **Apply database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the development server**
   ```bash
   # Terminal 1 — Backend API
   npm run dev:server

   # Terminal 2 — Mobile app
   npm run dev:mobile
   ```

7. **Connect your device**
   - Open **Expo Go** on your Android device
   - Scan the QR code from the terminal
   - Ensure your phone and computer are on the same network

> **💡 Tip:** On Windows, run `scripts/open-firewall.ps1` as Administrator to allow Expo connections through the firewall.

---

## Available Scripts

Run all scripts from the **root** of the project:

| Script | Command | Description |
|---|---|---|
| **Dev Server** | `npm run dev:server` | Start Express API with hot-reload |
| **Dev Mobile** | `npm run dev:mobile` | Start Expo development server |
| **Typecheck** | `npm run typecheck` | Run TypeScript type checking on server |
| **DB Generate** | `npm run db:generate` | Generate Prisma client from schema |
| **DB Migrate** | `npm run db:migrate` | Run Prisma database migrations |
| **DB Push** | `npm run db:push` | Push schema changes without migration history |
| **DB Studio** | `npm run db:studio` | Open Prisma Studio (database GUI) |
| **DB Seed** | `npm run db:seed` | Seed database with sample data |
| **Mobile Tests** | `npm -w apps/mobile test` | Run mobile unit tests (Jest) |

---

## Environment Variables

Create a `.env` file at the project root with the following variables:

| Variable | Description |
|---|---|
| `PORT` | Backend server port (e.g., `3000`) |
| `CORS_ORIGIN` | Allowed CORS origins |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only) |
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |

For the **mobile app**, set the API base URL in `apps/mobile/.env`:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the Express server (e.g., `http://192.168.x.x:3000`) |

---

## Mobile App Screens

### Authentication Flow
| Screen | Description |
|---|---|
| Welcome | Landing page with login/signup options |
| Login | Email & password login |
| Signup | Multi-step registration with role selection |
| Verify | OTP email verification |
| Forgot Password | Password reset request |
| New Password | Set a new password after verification |

### Donor Flow
| Screen | Description |
|---|---|
| Donor Home | Dashboard with stats, recent donations, and active listings |
| Add Food | Multi-step donation form with photo capture and location picker |
| Location Picker | Interactive map to pin drop-off location |
| All Recent Donations | Full history of past donations |
| Feedback | View ratings and reviews from recipients |
| Review Details | Detailed feedback information |

### Recipient Flow
| Screen | Description |
|---|---|
| Recipient Home | Browse recently available food |
| Browse Food | Search and filter all available donations |
| Food Map | Interactive map showing nearby food with donor callouts |
| All Recent Foods | Full browsable food listing |

### Shared Screens
| Screen | Description |
|---|---|
| My Cart | View and manage claimed food items |
| Notifications | In-app notification center |
| Profile | View and edit user profile |
| Edit Profile | Update personal information |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `POST` | `/api/auth/verify-otp` | Verify email OTP |
| `POST` | `/api/auth/resend-otp` | Resend verification OTP |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password |

### Food Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/food` | List all available food |
| `GET` | `/api/food/:id` | Get food details |
| `POST` | `/api/food` | Create a food listing |
| `PUT` | `/api/food/:id` | Update a food listing |
| `DELETE` | `/api/food/:id` | Delete a food listing |

### Distribution
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/distribution` | List distributions |
| `POST` | `/api/distribution/claim` | Claim a food listing |
| `PUT` | `/api/distribution/:id/status` | Update distribution status |
| `GET` | `/api/distribution/history` | Get distribution history |

### User & Profile
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Get current user profile |
| `PUT` | `/api/user/profile` | Update user profile |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Get donor dashboard statistics |

### Feedback
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/feedback` | Submit feedback for a donation |
| `GET` | `/api/feedback/:userId` | Get feedback for a user |

### Locations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/location` | Get drop-off locations |
| `POST` | `/api/location` | Create a drop-off location |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get user notifications |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |
| `POST` | `/api/notifications/push` | Send push notification |

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready, stable releases |
| `develop` | Integration branch; all feature work merges here first |
| `feature/*` | Individual feature branches (branch from `develop`) |
| `fix/*` | Bug fix branches |

**Workflow:**
1. Create a feature branch from `develop`: `git checkout -b feature/my-feature develop`
2. Develop and commit your changes
3. Push and open a Pull Request targeting `develop`
4. After review and CI passes, merge into `develop`
5. Periodically, `develop` is merged into `main` for releases

---

## CI / CD

The project uses **GitHub Actions** for continuous integration. The workflow is defined in `.github/workflows/ci.yml` and runs on every push and pull request.

**CI Pipeline includes:**
- Node.js 22 environment setup
- Dependency installation (`npm ci`)
- TypeScript type checking
- Prisma client generation

**EAS Build** is configured for building production-ready Android APKs via Expo Application Services.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request against `develop`

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Maintenance, dependency updates |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring |

---

## License

This project is privately maintained by the **KusinaKonek** team.

---

<p align="center">
  Made with ❤️ by the KusinaKonek Team
</p>
