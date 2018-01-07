module.exports = {
  extends: 'airbnb',
  parser: 'babel-eslint',
  env: {
    browser: true,
    node: true
  },
  plugins: ['jsx-a11y'],
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    'class-methods-use-this': 0,
    'comma-dangle': ['error', 'never'],
    'consistent-return': 0,
    'func-names': 0,
    'jsx-a11y/media-has-caption': 0,
    'max-len': 0,
    'no-mixed-operators': 0,
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'no-unused-expressions': 0,
    'global-require': 0,
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/prop-types': 0,
    strict: 0
  }
};
