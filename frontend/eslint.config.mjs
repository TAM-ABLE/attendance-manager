import nextPlugin from "@next/eslint-plugin-next"
import { defineConfig, globalIgnores } from "eslint/config"

// Next.js specific rules only - general linting handled by Biome
const eslintConfig = defineConfig([
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
])

export default eslintConfig
