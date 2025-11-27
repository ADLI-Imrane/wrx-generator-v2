import baseConfig from '../../packages/config/eslint/base.js';

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
];
