/**
 * Jest configuration for mobile-specific tests.
 * Run with: npx jest --config jest.config.mobile.js
 */
module.exports = {
  displayName: 'mobile',
  preset: 'react-native',

  // Only run tests tagged as mobile
  testMatch: [
    '<rootDir>/packages/app/features/mobile/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/packages/app/features/mobile/**/*.test.{ts,tsx}',
  ],

  // Transform settings
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
      },
    ],
  },

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/packages/app/$1',
  },

  // Mock native modules
  setupFiles: ['<rootDir>/jest.setup.mobile.js'],

  // Coverage config
  collectCoverageFrom: [
    'packages/app/features/mobile/**/*.{ts,tsx}',
    '!packages/app/features/mobile/**/__tests__/**',
    '!packages/app/features/mobile/**/index.ts',
    '!packages/app/features/mobile/**/mock-data.ts',
  ],

  coverageThresholds: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Timeout for slow RN tests
  testTimeout: 15000,
}
