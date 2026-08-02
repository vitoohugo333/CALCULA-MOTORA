import { test, expect } from '@playwright/test';

const STATE_KEY = 'vetta-driver-intelligence-v3';
const configuredState = {
  version: 10,
  release: '3.5.1',
  onboardingComplete: true,
  targetProfit: 4200,
  workWeekdays: [1, 2, 3, 4, 5, 6],
  extraDaysOff: 0,
  revenueKm: 2.4,
  fuel: { type: 'gasoline', label: 'Gasolina', unit: 'L', price: 6.2, efficiency: 10 },
  compare: { gasPrice: 6.2, gasEff: 10, gnvPrice: 4.8, gnvEff: 13, period: 1 },
  costs: [
    { id: 'fixed', name: 'Seguro', kind: 'monthly', category: 'obligation', value: 600, active: true },
    { id: 'maintenance', name: 'Manutenção', kind: 'per_km', category: 'reserve', value: 0.2, active: true },
  ],
  records: [
    { date: '2026-08-01', gross: 250, km: 100, hours: 8, fuelSpend: 55, fixedShareSnapshot: 30, perKmCostSnapshot: 0.2, percentCostSnapshot: 0 },
  ],
  events: [],
  closings: [],
};

async function openInstalled(page) {
  await page.addInitScript(({ key, state }) => {
    window.__VETTA_PWA_TEST_MODE__ = 'installed';
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: STATE_KEY, state: configuredState });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}

test('dist é carregado pelo Vite e mantém paridade financeira e de armazenamento', async ({ page }) => {
  await openInstalled(page);

  await expect(page.locator('html')).toHaveAttribute('data-vetta-build-system', 'vite');
  await expect(page.locator('html')).toHaveAttribute('data-vetta-vite-parity', 'pass');

  const initial = await page.evaluate(() => window.__vettaViteParity);
  expect(initial.status).toBe('pass');
  expect(initial.finance.equal).toBe(true);
  expect(initial.finance.differences).toEqual([]);
  expect(initial.storage.equal).toBe(true);
  expect(initial.storage.inspection.exists).toBe(true);
  expect(initial.storage.inspection.bytes).toBeGreaterThan(0);

  await page.locator('[data-model="targetProfit"]').first().evaluate(input => {
    input.value = '5600';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect.poll(() => page.evaluate(() => window.__vettaViteParity?.status)).toBe('pass');

  const updated = await page.evaluate(() => window.__vettaViteParity);
  expect(updated.finance.equal).toBe(true);
  expect(updated.storage.equal).toBe(true);
  expect(await page.locator('#targetProfitDisplay').textContent()).toContain('5.600');
});

test('dist preserva todos os fluxos herdados e registra o build Vite', async ({ page }) => {
  await openInstalled(page);
  const response = await page.request.get('./dev-build.json');
  expect(response.ok()).toBe(true);
  const build = await response.json();
  const source = await page.evaluate(() => ({
    branch: document.querySelector('meta[name="vetta-dev-branch"]')?.content || '',
    sha: document.querySelector('meta[name="vetta-dev-sha"]')?.content || '',
  }));

  expect(build.buildSystem).toBe('vite');
  expect(build.branch).toBe(source.branch);
  expect(build.sha).toBe(source.sha);
  expect(build.branch).toMatch(/^(feature|fix|refactor)\//);
  expect(build.sha).toMatch(/^[0-9a-f]{40}$/);

  await expect(page.locator('#vettaPwaInstallGate')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-vetta-didactic-language', 'ready');
  await expect(page.locator('html')).toHaveAttribute('data-vetta-onboarding-experience', 'ready');
  await page.locator('[data-view="day"]').first().click();
  await expect(page.locator('#view-day')).toBeVisible();
});