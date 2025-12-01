// __tests__/setup.js

// Define __DEV__ for React Native
global.__DEV__ = true;

// Mock React Native native bridge
global.__fbBatchedBridgeConfig = {
    remoteModuleConfig: [],
    localModulesConfig: [],
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useSegments: () => [],
    usePathname: () => '/',
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
    default: {
        expoConfig: {
            extra: {
                openaiApiKey: process.env.OPENAI_API_KEY || 'test-api-key',
            },
        },
    },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: 'SafeAreaView',
    SafeAreaProvider: 'SafeAreaProvider',
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock React Native's StyleSheet
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');

    RN.StyleSheet = {
        create: (styles) => styles,
        flatten: (styleArray) => {
            if (Array.isArray(styleArray)) {
                return Object.assign({}, ...styleArray);
            }
            return styleArray;
        },
        compose: (style1, style2) => [style1, style2],
    };

    return RN;
});

// Mock React Native Alert
global.alert = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
};

// Setup fetch mock for integration tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});
