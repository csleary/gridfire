module.exports = {
  env: {
    browser: true,
    es2020: true,
    es2021: true,
    jest: true,
    node: true
  },
  extends: ["eslint:recommended"],
  overrides: [],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: "latest",
    sourceType: "module"
  },
  root: true,
  rules: {
    indent: ["off"],
    "linebreak-style": ["warn", "unix"],
    "no-undef": "off", // Already handled by TypeScript
    "no-unused-vars": "off", // Already handled by TypeScript
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
};
