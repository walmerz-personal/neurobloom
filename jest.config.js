module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|react-native-svg|@react-native-community)/)',
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/android/',
        '/ios/',
        '/__tests__/setup.js',
    ],
    collectCoverageFrom: [
        'services/**/*.js',
        'components/**/*.js',
        'constants/**/*.js',
        'app/**/*.js',
        '!app/_layout.js',
        '!**/node_modules/**',
        '!**/__tests__/**',
    ],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    },
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
};
