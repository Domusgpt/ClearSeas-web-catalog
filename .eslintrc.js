/**
 * ESLint Configuration for Clear Seas Web Catalog
 *
 * Code quality and consistency rules for all JavaScript files
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error prevention
    'no-console': 'off', // Allow console for debugging
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Code style (handled by Prettier mostly)
    'semi': ['error', 'always'],
    'quotes': ['warn', 'single', { avoidEscape: true }],

    // ES6+
    'prefer-const': 'warn',
    'no-var': 'warn',
    'prefer-arrow-callback': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    'test-results/',
    'playwright-report/',
    '*.min.js',
    'vendor/'
  ],
  globals: {
    // WebGL globals
    'WebGLRenderingContext': 'readonly',
    'WebGL2RenderingContext': 'readonly',
    // GSAP globals
    'gsap': 'readonly',
    'ScrollTrigger': 'readonly'
  }
};
