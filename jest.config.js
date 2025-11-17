/**
 * Jest Configuration for Clear Seas Web Catalog
 *
 * Unit testing configuration for JavaScript modules and utilities
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Test match patterns
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/unit/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    '**/scripts/**/*.js',
    '**/src/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/test-results/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Transform files
  transform: {},

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test-results/'
  ],

  // Verbose output
  verbose: true
};
