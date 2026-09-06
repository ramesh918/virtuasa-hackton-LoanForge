import { defineConfig } from '@playwright/test';

/**
 * Assumes the API (default :3000) and the Vite dev server (:5173) are already running —
 * see README.md's Quick Start. Not wired into .gitlab-ci.yml since there's no CI runner
 * for this hackathon's infra (Section 7.5 of the brief); this is a local/manual E2E suite.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
});
