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
    // Target 95% when adding more tests; current ~69% (see tasks/todo.md)
    coverageThreshold: {
        global: {
            statements: 68,
            branches: 61,
            functions: 64,
            lines: 69,
        },
    },
};
