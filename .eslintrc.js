module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "airbnb",
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    camelcase: "off",
    "no-console": "off",
    "no-unused-vars": "off",
    "no-underscore-dangle": "off",
    quotes: "off",
    "react/jsx-indent": "off",
    'react/jsx-props-no-spreading': 'off',
    'no-async-promise-executor': 'off',
    'no-plusplus': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'linebreak-style': 'off',
    'no-param-reassign': 'off',
    'no-return-await': 'off',
    'import/prefer-default-export': 'off',
  },
};
