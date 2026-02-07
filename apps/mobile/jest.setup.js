// Jest global setup for KusinaKonek mobile

// Keep RN silent-ish in tests
jest.spyOn(global.console, 'warn').mockImplementation(() => {});

// ---- expo-router (required mock) ----
jest.mock('expo-router', () => {
  const React = require('react');

  const Stack = ({ children }) => React.createElement(React.Fragment, null, children);
  Stack.Screen = () => null;

  return {
    __esModule: true,
    Stack,
    Link: ({ children }) => React.createElement(React.Fragment, null, children),
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    },
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
  };
}, { virtual: true });

// ---- AsyncStorage (required mock) ----
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key) => (key in store ? store[key] : null)),
      setItem: jest.fn(async (key, value) => {
        store[key] = String(value);
      }),
      removeItem: jest.fn(async (key) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
      getAllKeys: jest.fn(async () => Object.keys(store)),
      multiGet: jest.fn(async (keys) => keys.map((k) => [k, store[k] ?? null])),
      multiSet: jest.fn(async (pairs) => {
        pairs.forEach(([k, v]) => {
          store[k] = String(v);
        });
      }),
    },
  };
}, { virtual: true });

// ---- expo-location (required mock) ----
jest.mock('expo-location', () => {
  return {
    __esModule: true,
    Accuracy: {
      Lowest: 1,
      Low: 2,
      Balanced: 3,
      High: 4,
      Highest: 5,
    },
    requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
    getCurrentPositionAsync: jest.fn(async () => ({
      coords: {
        latitude: 14.5995,
        longitude: 120.9842,
        accuracy: 5,
      },
      timestamp: Date.now(),
    })),
    reverseGeocodeAsync: jest.fn(async () => [{ city: 'Manila', country: 'PH' }]),
    watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
  };
}, { virtual: true });

// Common RN/Jest rough edges (safe defaults)
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });
