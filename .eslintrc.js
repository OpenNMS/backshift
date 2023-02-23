module.exports = {
  'env': {
    'browser': true,
    'node': false,
    'es6': true,
    'jquery': true,
  },
  'parser': '@babel/eslint-parser',
  'parserOptions': {
    'allowImportExportEverywhere': true,
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  extends: [
    "eslint:recommended",
  ],
  'rules': {
    'no-unused-vars': 'off',
    'no-empty': 'off',
  }
};
