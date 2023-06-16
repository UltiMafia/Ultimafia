module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["airbnb", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error",

    eqeqeq: "warn",
    "no-unused-vars": "warn",
    "no-plusplus": "warn",
    "no-param-reassign": "warn",
    "react/destructuring-assignment": "warn",

    "no-bitwise": "off",
    "react/prop-types": "off",
  },
  plugins: ["prettier"],
};
