module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script',
  },
  rules: {
    'no-undef': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
  globals: {
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly',
  },
};
