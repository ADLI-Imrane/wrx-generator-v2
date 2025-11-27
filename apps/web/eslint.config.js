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
];
