import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'vetta-driver-intelligence-v3';
const installedState = {
  version: 10,
  release: '3.5.1',
  onboardingComplete: true,
  targetProfit: 4000,
  workWeekdays: [1, 2, 3, 4, 5, 6],
  extraDaysOff: 0,
  revenueKm: 2.25,
  fuel: { type: 'gasoline', label: 'Gasolina', unit: 'L', price: 6.19, efficiency: 10.5 },
  compare: { gasPrice: 6.19, gasEff: 10.5, gnvPrice: 4.79, gnvEff: 13.2, period: 1 },
  costs: [],
  records: [],
  events: [],
  closings: [],
};

test('bloqueia o conteúdo em uma aba comum até o PWA ser instalado', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const gate = page.locator('#vettaPwaInstallGate');
  await expect(gate).toBeVisible();
  await expect(gate).toContainText('Instale o VETTA para continuar');
  await expect(page.locator('main')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-vetta-pwa-gate', 'locked');
  await expect(page.locator('#vettaPwaGateCheck')).toContainText('Já instalei');
});

test('mostra tutorial específico para iPhone', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    });
    Object.defineProperty(navigator, 'platform', { configurable: true, get: () => 'iPhone' });
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, get: () => 5 });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const gate = page.locator('#vettaPwaInstallGate');
  await expect(gate).toContainText('Adicione o VETTA à Tela de Início');
  await expect(gate).toContainText('Compartilhar');
  await expect(gate).toContainText('Adicionar à Tela de Início');
  await expect(page.locator('#vettaPwaGateAction')).toHaveText('Copiar link do VETTA');
});

test('libera o aplicativo em modo instalado e aplica linguagem didática', async ({ page }) => {
  await page.addInitScript(({ key, state }) => {
    window.__VETTA_PWA_TEST_MODE__ = 'installed';
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: STORAGE_KEY, state: installedState });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#vettaPwaInstallGate')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-vetta-pwa-gate', 'unlocked');
  await page.locator('[data-view="settings"]').first().click();
  await expect(page.locator('#fuelEfficiency').locator('xpath=preceding-sibling::label[1]')).toContainText('Quantos quilômetros');
  await expect(page.locator('#fuelEfficiency').locator('xpath=following-sibling::p[1]')).toContainText('10 km');
  await expect(page.locator('[data-model="revenueKm"]').locator('xpath=../../label[1]')).toContainText('Quanto você recebe por km rodado');
});
