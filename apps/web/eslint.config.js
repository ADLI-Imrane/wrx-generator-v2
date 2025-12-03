import reactConfig from '../../packages/config/eslint/react.js';

export default [
  ...reactConfig,
  {
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
      },
    },
  },
  {
    // Ignore E2E tests - Playwright's `use` function is not a React hook
    ignores: ['e2e/**'],
  },
  {
    // Test utilities can export non-components
    files: ['src/test/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
