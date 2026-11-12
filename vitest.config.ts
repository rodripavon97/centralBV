import path from "node:path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    // Los formularios largos se completan con `userEvent` carácter por carácter;
    // con la instrumentación de cobertura esos recorridos superan los 5 s por defecto.
    testTimeout: 20_000,
    // Los specs de Playwright viven en tests/e2e y no se ejecutan con Vitest.
    exclude: [...configDefaults.exclude, "tests/**", "dist/**"],
    coverage: {
      provider: "v8",
      // Solo se mide el código de la aplicación: no tests, configuración ni prototipos no ruteados.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/test/**",
        "src/**/*.test.{ts,tsx}",
        "src/**/types/**",
        "**/*.d.ts",
        "vite.config.ts",
        "vitest.config.ts",
      ],
      reporter: ["text", "lcov", "json-summary"],
      // Piso de cobertura medido en el proyecto (ver README de tests).
      // Si una PR lo baja, el CI falla antes de publicar en Codecov.
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 92,
      },
    },
  },
});
