// functions/eslint.config.js

const globals = require("globals");
const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  // A base config for all files.
  {
    files: ["**/*.js", "**/*.ts"],
    ignores: ["lib/**/*", "node_modules/**/*"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // General JavaScript rules.
      ...js.configs.recommended.rules,
      // Custom rules
      quotes: ["error", "double"],
      indent: ["error", 2, { SwitchCase: 1 }],
      semi: ["error", "always"],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_|^req|^res" }],
    },
  },

  // Rules specific to TypeScript files.
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.dev.json"],
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // TypeScript-specific recommended rules.
      ...tsPlugin.configs.recommended.rules,
      // Overrides or additional TypeScript rules.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_|^req|^res" },
      ],
    },
  },
];
