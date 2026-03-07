# README.md

# Mobile Project

This is the mobile application for the Kusina Konek project built using Expo. The application utilizes a file-based routing system and is structured to support scalability and maintainability.

## Project Structure

- **app/**: Contains the Expo Router file-based navigation screens.
  - **(auth)**: Authentication-related screens.
  - **(tabs)**: Tab navigation screens.
  - **\_layout.tsx**: Main layout component for the app.
  - **+not-found.tsx**: Component to handle not found routes.

- **src/**: Contains the core application logic.
  - **api/**: Axios service instances.
  - **components/**: Reusable components.
  - **config/**: Configuration files.
  - **hooks/**: Custom React hooks.
  - **state/**: Global state management.
  - **styles/**: Styling-related files.
  - **types/**: TypeScript definitions.
  - **utils/**: Utility functions.

## Getting Started

### 1. Install Dependencies (from repo root)

- Recommended: `npm ci`
- Or: `npm install`

### 2. Configure API Connection

**⚠️ Important: Environment configuration has moved to the ROOT `.env` file.**

All environment variables (including mobile app configuration) are now centralized in `../../.env` (root of the monorepo).

**Automated Setup (Recommended):**

```bash
# From the ROOT of the repository

# Windows (PowerShell)
.\scripts\setup-dev-env.ps1

# Mac/Linux
chmod +x scripts/setup-dev-env.sh
./scripts/setup-dev-env.sh
```

**Manual Setup:**

1. Copy `apps/mobile/.env.example` to `apps/mobile/.env`
2. Find your local IP address:
   - **Windows**: Run `ipconfig` in PowerShell and look for your WiFi/Ethernet IPv4 Address
   - **Mac/Linux**: Run `ifconfig | grep "inet "` and look for your local IP
3. Update `EXPO_PUBLIC_API_HOST` in the root `.env` with your IP address

Example `apps/mobile/.env` (partial):

```
EXPO_PUBLIC_API_HOST=10.142.135.110
EXPO_PUBLIC_API_PORT=3001
```

**Important Notes:**

- Expo reads `EXPO_PUBLIC_*` variables from `apps/mobile/.env` (or your shell env)
- The backend server uses the monorepo root `.env` for secrets/DB config
- Each team member needs their own `apps/mobile/.env` with their machine's IP
- `.env` files are gitignored, so you won't conflict with other developers
- If your IP changes (e.g., different WiFi network), run the setup script again
- Make sure your backend server is running on the same port as `EXPO_PUBLIC_API_PORT`
- Your device/emulator must be on the same network as your development machine

### 3. Run the Application (from repo root)

- `npm run dev:mobile`

### 4. Build for Production

Use EAS Build (recommended) or a custom build pipeline for production releases.

## API Integration

The application uses Axios for API calls. The configuration is managed through:

- **`src/config/apiConfig.ts`**: Auto-detects the API base URL based on environment and platform
- **`src/api/axiosClient.ts`**: Configured Axios instance with authentication interceptors
- **Root `.env`**: Centralized environment configuration (not committed to git)

The API client automatically:

- Reads configuration from the root `.env` file
- Detects iOS Simulator, Android Emulator, or physical devices
- Injects authentication tokens from Supabase
- Handles token refresh on 401 responses
- Uses environment variables for flexible configuration across team members

**Note:** All environment variables are read from the root `.env` file, allowing all apps in the monorepo to share configuration.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
