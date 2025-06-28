const { defineConfig } = require("eslint/config");

const globals = require("globals");
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node
      },

      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },

    extends: compat.extends("eslint:recommended"),

    rules: {
      indent: ["off"],
      "linebreak-style": ["warn", "unix"],
      "no-undef": "off",
      "no-unused-vars": "off",
      quotes: ["warn", "double"],
      semi: ["warn", "always"],
      "sort-imports": ["warn"],
      "sort-vars": ["warn"]
    },

    settings: {
      react: {
        version: "detect"
      }
    }
  }
]);
