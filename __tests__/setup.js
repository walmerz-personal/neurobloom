// __tests__/setup.js

// Define __DEV__ for React Native
global.__DEV__ = true;

// Provide requestAnimationFrame for environments that lack it (e.g., legacy fake timers)
if (typeof global.requestAnimationFrame === 'undefined') {
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
}

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

// Mock TurboModuleRegistry
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
    const mockDeviceInfo = {
        getConstants: () => ({
            Dimensions: {
                window: { fontScale: 2.0, height: 1334, scale: 2.0, width: 750 },
                screen: { fontScale: 2.0, height: 1334, scale: 2.0, width: 750 },
            },
        }),
    };

    return {
        getEnforcing: (name) => {
            if (name === 'DeviceInfo') {
                return mockDeviceInfo;
            }
            return {
                getConstants: () => ({}),
            };
        },
        get: (name) => {
            if (name === 'DeviceInfo') {
                return mockDeviceInfo;
            }
            return {
                getConstants: () => ({}),
            };
        },
    };
});

// Mock NativeModules
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
    SettingsManager: {
        settings: { AppleLocale: 'en_US', AppleLanguages: ['en'] },
    },
    I18nManager: {
        localeIdentifier: 'en_US',
    },
    SourceCode: {
        scriptURL: null,
    },
    PlatformConstants: {
        forceTouchAvailable: false,
    },
    BlobModule: {
        BLOB_URI_SCHEME: 'content',
        BLOB_URI_HOST: null,
        addNetworkingHandler: jest.fn(),
        getConstants: () => ({}),
    },
    DeviceInfo: {
        Dimensions: {
            window: { fontScale: 2.0, height: 1334, scale: 2.0, width: 750 },
            screen: { fontScale: 2.0, height: 1334, scale: 2.0, width: 750 },
        }
    },
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
    useFocusEffect: jest.fn(),
}));

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill/auto', () => { });
jest.mock('react-native-url-polyfill', () => { });

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

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
    cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
    getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
    SchedulableTriggerInputTypes: {
        DAILY: 'daily',
    },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        SafeAreaView: ({ children, style, edges, ...props }) => (
            <View style={style} edges={edges} {...props}>{children}</View>
        ),
        SafeAreaProvider: 'SafeAreaProvider',
        useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    };
});

// Comprehensive React Native Mock
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');

    return {
        ...RN,
        NativeModules: {
            ...RN.NativeModules,
            SettingsManager: {
                settings: { AppleLocale: 'en_US', AppleLanguages: ['en'] },
            },
            I18nManager: {
                localeIdentifier: 'en_US',
            },
            SourceCode: {
                scriptURL: null,
            },
            PlatformConstants: {
                forceTouchAvailable: false,
            },
            BlobModule: {
                BLOB_URI_SCHEME: 'content',
                BLOB_URI_HOST: null,
                addNetworkingHandler: jest.fn(),
            },
            DeviceInfo: {
                Dimensions: {
                    window: { fontScale: 2.0, height: 1334, scale: 2.0, width: 750 },
                    screen: { fontScale: 2.0, height: 1334, scale: 2.0, width: 750 },
                }
            },
        },
        TurboModuleRegistry: {
            getEnforcing: (name) => ({
                getConstants: () => ({}),
            }),
        },
        StyleSheet: {
            ...RN.StyleSheet,
            create: (styles) => styles,
            flatten: (styleArray) => Object.assign({}, ...(Array.isArray(styleArray) ? styleArray : [styleArray])),
        },
        Platform: {
            ...RN.Platform,
            OS: 'ios',
            Version: 17,
            select: (objs) => objs.ios,
        },
        Dimensions: {
            get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        },
        Animated: {
            ...RN.Animated,
            timing: jest.fn(() => ({ start: jest.fn() })),
            spring: jest.fn(() => ({ start: jest.fn() })),
            View: 'View',
            Text: 'Text',
            Value: jest.fn(() => ({ interpolate: jest.fn(), setValue: jest.fn(), addListener: jest.fn(), removeAllListeners: jest.fn() })),
            parallel: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
            stagger: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
            sequence: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
            createAnimatedComponent: (component) => component,
        },
    };
});

// Mock NativeAnimatedHelper to prevent animation cleanup errors in tests
jest.mock('react-native/src/private/animated/NativeAnimatedHelper', () => ({
    API: {
        getValue: jest.fn(),
        setWaitingForIdentifier: jest.fn(),
        unsetWaitingForIdentifier: jest.fn(),
        disableQueue: jest.fn(),
        flushQueue: jest.fn(),
        createAnimatedNode: jest.fn(),
        updateAnimatedNodeConfig: jest.fn(),
        startListeningToAnimatedNodeValue: jest.fn(),
        stopListeningToAnimatedNodeValue: jest.fn(),
        connectAnimatedNodes: jest.fn(),
        disconnectAnimatedNodes: jest.fn(),
        startAnimatingNode: jest.fn(),
        stopAnimation: jest.fn(),
        setAnimatedNodeValue: jest.fn(),
        setAnimatedNodeOffset: jest.fn(),
        flattenAnimatedNodeOffset: jest.fn(),
        extractAnimatedNodeOffset: jest.fn(),
        connectAnimatedNodeToView: jest.fn(),
        disconnectAnimatedNodeFromView: jest.fn(),
        restoreDefaultValues: jest.fn(),
        dropAnimatedNode: jest.fn(),
        addAnimatedEventToView: jest.fn(),
        removeAnimatedEventFromView: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
    },
    addWhitelistedNativeProps: jest.fn(),
    addWhitelistedUIProps: jest.fn(),
    validateStyles: jest.fn(),
    validateInterpolation: jest.fn(),
    generateNewNodeTag: jest.fn(() => 1),
    generateNewAnimationId: jest.fn(() => 1),
    assertNativeAnimatedModule: jest.fn(),
    shouldUseNativeDriver: jest.fn(() => false),
    transformDataType: jest.fn((value) => value),
    default: {
        createAnimatedNode: jest.fn(),
        startListeningToAnimatedNodeValue: jest.fn(),
        stopListeningToAnimatedNodeValue: jest.fn(),
        connectAnimatedNodes: jest.fn(),
        disconnectAnimatedNodes: jest.fn(),
        startAnimatingNode: jest.fn(),
        stopAnimation: jest.fn(),
        setAnimatedNodeValue: jest.fn(),
        setAnimatedNodeOffset: jest.fn(),
        flattenAnimatedNodeOffset: jest.fn(),
        extractAnimatedNodeOffset: jest.fn(),
        connectAnimatedNodeToView: jest.fn(),
        disconnectAnimatedNodeFromView: jest.fn(),
        restoreDefaultValues: jest.fn(),
        dropAnimatedNode: jest.fn(),
        addAnimatedEventToView: jest.fn(),
        removeAnimatedEventFromView: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
    },
}));

// Mock React Native Alert (both global and RCTAlertManager)
global.alert = jest.fn();

// Mock RCTAlertManager so Alert.alert works in tests
jest.mock('react-native/Libraries/Alert/RCTAlertManager', () => ({
    alertWithArgs: jest.fn(),
}));

// Mock NativeAlertManager so Alert.alert works in tests
jest.mock('react-native/Libraries/Alert/NativeAlertManager', () => ({
    __esModule: true,
    default: {
        alertWithArgs: jest.fn(),
    },
}));

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

// Mock @kingstinct/react-native-healthkit
jest.mock('@kingstinct/react-native-healthkit', () => {
    const mockHealthKit = {
        isHealthDataAvailable: jest.fn(() => Promise.resolve(true)),
        requestAuthorization: jest.fn(() => Promise.resolve(true)),
        authorizationStatusFor: jest.fn(() => Promise.resolve(2)), // sharingAuthorized = 2
        queryQuantitySamples: jest.fn(() => Promise.resolve([])),
        queryCategorySamples: jest.fn(() => Promise.resolve([])),
        queryStatisticsForQuantity: jest.fn(() => Promise.resolve(null)),
        getBiologicalSex: jest.fn(() => Promise.resolve(null)),
        getBloodType: jest.fn(() => Promise.resolve(null)),
        getDateOfBirth: jest.fn(() => Promise.resolve(null)),
        HKQuantityTypeIdentifier: {
            stepCount: 'HKQuantityTypeIdentifierStepCount',
            distanceWalkingRunning: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
            walkingSpeed: 'HKQuantityTypeIdentifierWalkingSpeed',
        },
        HKCategoryTypeIdentifier: {
            appleWalkingSteadinessEvent: 'HKCategoryTypeIdentifierAppleWalkingSteadinessEvent',
        },
    };
    return {
        __esModule: true,
        default: mockHealthKit,
        ...mockHealthKit,
    };
}, { virtual: true });

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
    setStringAsync: jest.fn(() => Promise.resolve(true)),
    getStringAsync: jest.fn(() => Promise.resolve('')),
    hasStringAsync: jest.fn(() => Promise.resolve(false)),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return {
        LinearGradient: View,
    };
});

// Mock expo-font
jest.mock('expo-font', () => ({
    useFonts: jest.fn(() => [true, null]),
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
    StatusBar: 'StatusBar',
}));

// Mock lottie-react-native
jest.mock('lottie-react-native', () => 'LottieView');

// Mock lucide-react-native — return a generic component for any icon import
jest.mock('lucide-react-native', () => {
    return new Proxy({}, {
        get: (_target, name) => name,
    });
});

// Mock rive-react-native
jest.mock('rive-react-native', () => ({
    default: 'RiveView',
    Fit: { Contain: 'contain' },
    Alignment: { Center: 'center' },
}));

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});
