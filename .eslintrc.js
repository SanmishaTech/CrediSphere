module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true, // Add jest environment for testing
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended', // Add TypeScript recommended rules
  ],
  parser: '@typescript-eslint/parser', // Add TypeScript parser
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint', // Add TypeScript plugin
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'import/no-unresolved': 'off', // Disable import/no-unresolved rule
    'import/extensions': 'off',
    'no-unused-vars': 'warn',
    'no-shadow': 'off',
    'no-underscore-dangle': 'off',
    'consistent-return': 'off',
    'no-param-reassign': 'off',
    'no-return-await': 'off',
    'no-use-before-define': 'off',
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'guard-for-in': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'max-len': ['warn', { code: 120 }],
    'no-nested-ternary': 'off',
    radix: 'off',
    '@typescript-eslint/no-explicit-any': 'off', // Allow explicit any type
  },
};
