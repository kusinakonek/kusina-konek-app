# Environment Configuration Migration

## What Changed?

**Date:** February 11, 2026

We've **centralized all environment configuration** into a single `.env` file at the root of the monorepo. This eliminates the need for multiple `.env` files across different apps.

## Why?

- ✅ **Single source of truth** - One file for all configuration
- ✅ **Less confusion** - No more wondering which `.env` to update
- ✅ **Easier onboarding** - New team members configure once
- ✅ **Consistent configuration** - All apps share the same environment
- ✅ **Version control friendly** - Only one `.env` to gitignore

## Before vs After

### Before ❌

```
kusina-konek-app/
├── .env                    # Server config
├── apps/
│   ├── mobile/
│   │   └── .env           # Mobile config (duplicate!)
│   └── server/
│       └── (uses root .env)
```

### After ✅

```
kusina-konek-app/
├── .env                    # ALL configuration here
├── .env.example           # Template for team
├── apps/
│   ├── mobile/
│   │   ├── .env           # Redirects to root (deprecated)
│   │   └── .env.example   # Redirects to root
│   └── server/
```

## Migration Steps for Team Members

### If you had `apps/mobile/.env`:

1. **Copy your IP** from `apps/mobile/.env` (the `EXPO_PUBLIC_API_HOST` value)
2. **Delete or ignore** `apps/mobile/.env`
3. **Update root `.env`** with your IP:
   ```bash
   # In the root .env file, find or add:
   EXPO_PUBLIC_API_HOST=your.ip.address.here
   EXPO_PUBLIC_API_PORT=3000
   ```

### Quick Setup (Recommended):

Run the automated setup script from the root:

```bash
# Windows (PowerShell)
.\scripts\setup-dev-env.ps1

# Mac/Linux
./scripts/setup-dev-env.sh
```

This will automatically detect your IP and update the root `.env` file.

## What's New?

### New Files

- **`/.env.example`** - Comprehensive template with all variables documented
- **`/scripts/setup-dev-env.ps1`** - Windows setup script (moved from apps/mobile)
- **`/scripts/setup-dev-env.sh`** - Mac/Linux setup script (moved from apps/mobile)

### Updated Files

- **Root `.env`** - Now includes mobile app configuration
- **`apps/mobile/.env`** - Now redirects to root (deprecated)
- **`apps/mobile/.env.example`** - Updated with migration instructions
- **`apps/mobile/setup-ip.*`** - Deprecated, redirects to root scripts

### Documentation Updates

- **Root `README.md`** - Added environment setup section
- **`apps/mobile/README.md`** - Updated setup instructions

## Configuration Variables

All these variables are now in the **root `.env`** file:

### Server

- `PORT`
- `CORS_ORIGIN`

### Mobile App

- `EXPO_PUBLIC_API_HOST` ⭐ **Your machine's IP**
- `EXPO_PUBLIC_API_PORT`
- `EXPO_PUBLIC_API_URL` (production only)

### Database & Auth

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

### Security

- `JWT_SECRET`
- `ENCRYPTION_KEY`

## Team Workflow

### First Time Setup

1. Clone the repository
2. Run setup script: `.\scripts\setup-dev-env.ps1` (or `.sh` on Mac/Linux)
3. Fill in Supabase credentials in root `.env`
4. Start developing!

### When Switching Networks

Just run the setup script again - it will update your IP automatically.

### When Pulling from Main

Your `.env` is gitignored, so you'll never have conflicts!

## FAQ

**Q: Do I need to delete `apps/mobile/.env`?**  
A: The mobile app now reads from the root `.env`. The file in `apps/mobile/.env` is kept for backwards compatibility but is no longer used. You can keep it or delete it.

**Q: What if I'm working on a different network?**  
A: Just run the setup script again - it will detect your new IP and update the root `.env`.

**Q: Can I still manually configure?**  
A: Yes! Just edit the root `.env` file and set `EXPO_PUBLIC_API_HOST` to your machine's IP address.

**Q: Will this affect production builds?**  
A: No. Production builds should use `EXPO_PUBLIC_API_URL` which points to your production server, not a local IP.

**Q: Do server and mobile share all variables?**  
A: They share the root `.env`, but each reads only the variables it needs. Mobile app only reads `EXPO_PUBLIC_*` variables, while server reads database and Supabase credentials.

## Need Help?

If you encounter any issues:

1. Check that the root `.env` exists and has `EXPO_PUBLIC_API_HOST` set
2. Verify your IP address is correct: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Ensure your backend server is running
4. Make sure your device/emulator is on the same network
5. Restart your Expo development server

## Rollback (if needed)

If you need to temporarily use the old setup:

1. Create `apps/mobile/.env` with your IP
2. The app will still work (reads from root first, falls back to local)

However, we recommend using the new centralized approach for consistency.
