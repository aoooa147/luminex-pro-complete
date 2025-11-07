# 🧪 Testing Guide

This document describes the testing infrastructure for Luminex.

## 📋 Overview

We use a comprehensive testing strategy with:
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest for API routes
- **E2E Tests**: Playwright

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm run test:all
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test

# Unit tests in watch mode
npm run test:watch

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## 📁 Test Structure

```
├── lib/utils/__tests__/          # Unit tests for utilities
│   ├── validation.test.ts
│   ├── logger.test.ts
│   └── apiHandler.test.ts
├── components/common/__tests__/  # Component tests
│   ├── LoadingStates.test.tsx
│   └── EmptyStates.test.tsx
├── app/api/__tests__/            # API integration tests
│   └── validation.test.ts
└── e2e/                          # E2E tests
    └── example.spec.ts
```

## 🧪 Unit Tests

Unit tests are located in `__tests__` directories next to the files they test.

### Example: Testing Validation Utilities

```typescript
import { isValidAddress } from '@/lib/utils/validation';

describe('isValidAddress', () => {
  it('should validate correct Ethereum addresses', () => {
    expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(true);
  });
});
```

## 🎨 Component Tests

Component tests use React Testing Library to test component behavior.

### Example: Testing LoadingSpinner

```typescript
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/common/LoadingStates';

test('should render with text', () => {
  render(<LoadingSpinner text="Loading..." />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

## 🔌 Integration Tests

Integration tests verify that API routes work correctly with validation and error handling.

## 🌐 E2E Tests

E2E tests use Playwright to test the full application flow.

### Running E2E Tests

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In another terminal, run E2E tests:
   ```bash
   npm run test:e2e
   ```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should load the main page', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(page).toHaveURL(/.*/);
});
```

## 📊 Coverage

View coverage reports:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## 🎯 Coverage Goals

Current coverage thresholds:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## 📝 Writing Tests

### Best Practices

1. **Test behavior, not implementation**
   - Focus on what the component/function does, not how it does it

2. **Use descriptive test names**
   - Test names should clearly describe what is being tested

3. **Keep tests isolated**
   - Each test should be independent and not rely on other tests

4. **Mock external dependencies**
   - Mock API calls, localStorage, etc.

5. **Test edge cases**
   - Test error conditions, empty states, boundary values

### Example Test Structure

```typescript
describe('Feature Name', () => {
  describe('Function Name', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## 🔧 Configuration

### Jest Configuration

See `jest.config.js` for Jest configuration.

### Playwright Configuration

See `playwright.config.ts` for Playwright configuration.

## 🐛 Debugging Tests

### Debug Jest Tests

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debug Playwright Tests

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can debug tests interactively.

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)

## ✅ Test Checklist

When adding new features:

- [ ] Add unit tests for utility functions
- [ ] Add component tests for new components
- [ ] Add integration tests for new API routes
- [ ] Add E2E tests for critical user flows
- [ ] Ensure all tests pass
- [ ] Check coverage meets thresholds

