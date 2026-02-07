# README.md

# Mobile Project

This is the mobile application for the Kusina Konek project built using Expo. The application utilizes a file-based routing system and is structured to support scalability and maintainability.

## Project Structure

- **app/**: Contains the Expo Router file-based navigation screens.
  - **(auth)**: Authentication-related screens.
  - **(tabs)**: Tab navigation screens.
  - **_layout.tsx**: Main layout component for the app.
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

1. **Install Dependencies (from repo root)**:
  - Recommended: `npm ci`
  - Or: `npm install`

2. **Run the Application (from repo root)**:
  - `npm run dev:mobile`

3. **Build for Production**: Use EAS Build (recommended) or a custom build pipeline for production releases.

## API Integration

The application uses Axios for API calls. The Axios client is configured in `src/api/axiosClient.ts` with a base URL pointing to the backend server.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.