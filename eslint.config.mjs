import { defineConfig } from "eslint/config";
import babelParser from "@babel/eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: compat.extends("important-stuff", "plugin:prettier/recommended"),
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: true,
      },
    },
    ignores: ["dist/**", "node_modules/**", "**/coverage/**"],
  },
  {
    files: ["**/*.ts"],
    rules: {
      "no-undef": "off",
    },
  },
]);
