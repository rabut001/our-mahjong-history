import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import noDeadButton from "./eslint-rules/no-dead-button.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  {
    files: ["src/**/*.{jsx,tsx}"],
    plugins: {
      local: {
        rules: {
          "no-dead-button": noDeadButton,
        },
      },
    },
    rules: {
      "local/no-dead-button": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/lib/supabase/database.types.ts",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
