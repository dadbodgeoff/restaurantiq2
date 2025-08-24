module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'prefer-arrow',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // TypeScript - Enterprise Grade
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',

    // Code Quality
    'prefer-arrow/prefer-arrow-functions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',

    // Best Practices
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-eval': 'error',
    'no-unused-expressions': 'error',
  },
  env: {
    node: true,
    es2022: true,
  },
};
