module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true
    },
    sourceType: 'module'
  },
  plugins: ['react', 'jsx-a11y'],
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    'comma-dangle': ['error', 'never'],
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    'react/prop-types': 0,
    semi: ['error', 'always']
  }
};
