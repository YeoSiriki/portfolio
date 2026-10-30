import { defineConfig, devices } from '@playwright/test';

// Tests de bout en bout des parcours clés (cahier des charges, section 12).
// Ils s'exécutent contre un site construit et démarré : npm run build && npm run start
// puis, dans un autre terminal : npm run test:e2e
// L'adresse se change avec E2E_BASE_URL ; les identifiants de l'admin avec E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001',
    locale: 'fr-FR',
    // E2E_CHANNEL=msedge (ou chrome) utilise le navigateur déjà installé au lieu de celui de Playwright.
    channel: process.env.E2E_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
});
