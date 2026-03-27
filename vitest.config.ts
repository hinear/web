import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["next/dynamic"],
  },
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: "jsdom",
          globals: true,
          setupFiles: ["./src/test/setup.ts"],
          exclude: [
            ...Array.from({ length: 10 }, (_, i) => `**/.${i}/**`),
            "node_modules",
            "dist",
            ".next",
            "mcp/**", // Temporarily skip MCP tests
            "**/*.config.ts",
            "**/*.config.js",
          ],
        },
      },
      // Temporarily disabled due to configuration issues
      // {
      //   extends: true,
      //   test: {
      //     name: "browser",
      //     globals: true,
      //     include: ["src/**/*.browser.test.{ts,tsx}"],
      //     setupFiles: ["./src/test/browser-setup.ts"],
      //     browser: {
      //       enabled: true,
      //       headless: true,
      //       provider: playwright({}),
      //       instances: [
      //         {
      //           browser: "chromium",
      //         },
      //       ],
      //     },
      //   },
      // },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          exclude: ["src/features/issues/components/kanban-board.stories.tsx"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
