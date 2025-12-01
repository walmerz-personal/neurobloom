# NeuroBloom Testing Guide

This document provides comprehensive information about the testing infrastructure for the NeuroBloom application.

## Overview

NeuroBloom uses **Jest** and **React Native Testing Library** for unit and integration testing. The test suite covers:

- **Services**: API integration, data persistence, and business logic
- **Components**: UI rendering, user interactions, and styling
- **Constants**: Configuration validation and type safety

## Test Coverage

Current coverage target: **95%** for all modules

### Test Statistics
- **Total Test Files**: 8
- **Total Tests**: 180+
- **Coverage Areas**:
  - Services: `UserProfileService.js`, `LillyService.js`
  - Components: `Button.js`, `TabBar.js`, `ScreenWrapper.js`
  - Constants: `Colors.js`, `Typography.js`, `Config.js`

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/services/UserProfileService.test.js
```

### Run Tests for a Specific Directory
```bash
# Test only services
npm test -- __tests__/services

# Test only components
npm test -- __tests__/components

# Test only constants
npm test -- __tests__/constants
```

## Test Structure

```
__tests__/
├── setup.js                              # Test configuration and mocks
├── services/
│   ├── UserProfileService.test.js       # 25 tests
│   └── LillyService.test.js             # 50+ tests
├── components/
│   ├── Button.test.js                   # 30+ tests
│   ├── TabBar.test.js                   # 40+ tests
│   └── ScreenWrapper.test.js            # 10+ tests
└── constants/
    ├── Colors.test.js                   # 30+ tests
    ├── Typography.test.js               # 30+ tests
    └── Config.test.js                   # 30+ tests
```

## Test Categories

### Service Tests

**UserProfileService.js**
- Profile save/load/clear operations
- AsyncStorage integration
- Error handling
- Profile formatting for AI context

**LillyService.js**
- OpenAI API integration tests
- Emergency keyword detection
- Conversation history management
- User profile context injection
- Action detection (navigation)
- Error handling and fallbacks

### Component Tests

**Button.js**
- Primary and secondary button rendering
- Press event handling
- Custom styling
- Accessibility
- Design consistency

**TabBar.js**
- Tab rendering and icons
- Navigation logic
- Active state highlighting
- Long press handling
- Accessibility labels

**ScreenWrapper.js**
- Children rendering
- SafeAreaView configuration
- Custom styling
- Layout properties

### Constants Tests

**Colors.js**
- Color definitions validation
- Hex format validation
- Brand consistency
- Accessibility (contrast)

**Typography.js**
- Typography hierarchy
- Font size/weight validation
- Color consistency
- Accessibility

**Config.js**
- API configuration
- Environment variables
- URL validation
- Type safety

## Mocks and Setup

### Global Mocks
Located in `__tests__/setup.js`:

- **AsyncStorage**: Mocked for profile persistence tests
- **expo-router**: Mocked navigation
- **expo-constants**: Mocked for config/env vars
- **fetch**: Mocked for API integration tests

### Custom Mocks
- File assets (images, SVGs) via `__mocks__/fileMock.js`

## Writing New Tests

### Basic Test Structure
```javascript
import { render, fireEvent } from '@testing-library/react-native';
import YourComponent from '../../path/to/component';

describe('YourComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<YourComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

### Testing Async Functions
```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expectedValue);
});
```

### Testing User Interactions
```javascript
it('should call handler on press', () => {
  const mockHandler = jest.fn();
  const { getByText } = render(
    <Button onPress={mockHandler} title="Click Me" />
  );
  
  fireEvent.press(getByText('Click Me'));
  expect(mockHandler).toHaveBeenCalledTimes(1);
});
```

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/lcov-report/index.html
```

The coverage report shows:
- **Statements**: % of code statements executed
- **Branches**: % of conditional branches tested
- **Functions**: % of functions called
- **Lines**: % of lines executed

## Continuous Integration

Tests should be run before:
- Committing code
- Creating pull requests
- Deploying to production

## Troubleshooting

### Tests Failing
1. Check that all dependencies are installed: `npm install`
2. Clear Jest cache: `npx jest --clearCache`
3. Ensure mocks are properly configured in `__tests__/setup.js`

### Coverage Not Reaching Target
1. Run `npm run test:coverage` to see uncovered lines
2. Review the HTML coverage report
3. Add tests for uncovered code paths

### Mock Issues
- Ensure mocks in `__tests__/setup.js` match the actual module exports
- Check that `beforeEach(() => jest.clearAllMocks())` is in place

## Best Practices

1. **Write Descriptive Test Names**: Use "should..." format
2. **Test One Thing Per Test**: Keep tests focused and simple
3. **Use Meaningful Assertions**: Test behavior, not implementation
4. **Mock External Dependencies**: Keep tests isolated and fast
5. **Test Edge Cases**: Include error cases, empty states, boundary conditions
6. **Keep Tests Maintainable**: Refactor tests as you refactor code

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
