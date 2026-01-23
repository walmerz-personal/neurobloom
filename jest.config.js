module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|@react-navigation|expo|expo-.*|@expo|react-native-svg|@react-native-community|react-native-url-polyfill|lucide-react-native)/)',
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/android/',
        '/ios/',
        '/__tests__/setup.js',
    ],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    },
};
