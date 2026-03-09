module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
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
