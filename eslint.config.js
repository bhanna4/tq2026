const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');
const prettier = require('eslint-config-prettier');

const NO_ABSOLUTE_XPATH = {
  selector: "CallExpression[callee.property.name='locator'] Literal[value=/^\\/\\//]",
  message:
    'Absolute XPath locators are not permitted. Use a Playwright locator (getByRole, getByLabel, getByText, getByTestId, ...) or a relative/scoped CSS selector instead.',
};

const NO_RAW_LOCATORS_IN_TESTS = {
  selector:
    "CallExpression[callee.object.name='page'][callee.property.name=/^(locator|getByRole|getByLabel|getByText|getByTestId|getByTitle|getByAltText|getByPlaceholder)$/]",
  message:
    'Test files must not query locators directly on `page`. Encapsulate all locators and interactions inside a Page Object class under pages/, and call its methods from the test.',
};

module.exports = tseslint.config(
  {
    ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', 'blob-report/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  playwright.configs['flat/recommended'],
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      'no-restricted-syntax': ['error', NO_ABSOLUTE_XPATH],
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', NO_ABSOLUTE_XPATH, NO_RAW_LOCATORS_IN_TESTS],
    },
  },
  {
    files: ['pages/**/*.ts'],
    rules: {
      // Page objects are the only place allowed to query `page` directly.
      'no-restricted-syntax': ['error', NO_ABSOLUTE_XPATH],
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
