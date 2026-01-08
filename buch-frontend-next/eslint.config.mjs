import { defineConfig, globalIgnores } from "eslint/config";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import prettier from "eslint-plugin-prettier";
import unusedImports from "eslint-plugin-unused-imports";

export default defineConfig([
  // Next.js Presets
  ...nextVitals,
  ...nextTs,

  // Eigene Plugins & Regeln
  {
    plugins: {
      prettier,
      "unused-imports": unusedImports,
    },
    rules: {
      // Prettier als ESLint-Rule
      "prettier/prettier": "error",

      // Unused Imports / Vars
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Overrides der Default-Ignores von eslint-config-next
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
