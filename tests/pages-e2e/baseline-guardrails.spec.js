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

async function openInstalled(page) {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', request => browserErrors.push(`request: ${request.url()} ${request.failure()?.errorText || ''}`));

  await page.addInitScript(({ key, state }) => {
    window.__VETTA_PWA_TEST_MODE__ = 'installed';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: STORAGE_KEY, state: installedState });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-vetta-pwa-gate', 'unlocked');
  return browserErrors;
}

test('baseline mobile não cria rolagem horizontal e mantém o card principal na viewport', async ({ page }) => {
  const browserErrors = await openInstalled(page);

  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const dashboard = document.querySelector('#view-dashboard');
    const hero = dashboard?.firstElementChild;
    const rect = hero?.getBoundingClientRect();
    return {
      rootScrollWidth: root.scrollWidth,
      rootClientWidth: root.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      heroLeft: rect?.left ?? -1,
      heroRight: rect?.right ?? Number.POSITIVE_INFINITY,
      viewportWidth: window.innerWidth,
    };
  });

  expect(geometry.rootScrollWidth).toBeLessThanOrEqual(geometry.rootClientWidth);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.bodyClientWidth);
  expect(geometry.heroLeft).toBeGreaterThanOrEqual(0);
  expect(geometry.heroRight).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(browserErrors).toEqual([]);
});

test('barra inferior mantém cinco destinos visíveis, dentro da viewport e clicáveis', async ({ page }) => {
  const browserErrors = await openInstalled(page);
  const navButtons = page.locator('nav.fixed [data-view], nav[class*="fixed"] [data-view]');
  await expect(navButtons).toHaveCount(5);

  const expectedViews = ['dashboard', 'day', 'history', 'more', 'settings'];
  for (const view of expectedViews) {
    const button = page.locator(`[data-view="${view}"]`).last();
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box, `${view} deve ter geometria visível`).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    await button.click();
    await expect(page.locator(`#view-${view}`)).toBeVisible();
  }

  expect(browserErrors).toEqual([]);
});

test('manifesto publicado resolve start_url, scope e todos os ícones', async ({ page, request }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const manifestUrl = new URL(manifestHref, page.url()).toString();
  const response = await request.get(manifestUrl);
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.display).toBe('standalone');

  const startUrl = new URL(manifest.start_url, manifestUrl);
  const scopeUrl = new URL(manifest.scope, manifestUrl);
  expect(startUrl.pathname).toBe('/');
  expect(scopeUrl.pathname).toBe('/');

  for (const icon of manifest.icons) {
    const iconResponse = await request.get(new URL(icon.src, manifestUrl).toString());
    expect(iconResponse.ok(), `ícone ausente: ${icon.src}`).toBeTruthy();
    expect(Number(iconResponse.headers()['content-length'] || 1)).toBeGreaterThan(0);
  }
});

test('service worker instala, ativa e controla a página publicada', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const state = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
    return {
      supported: true,
      active: registration.active?.state,
      scope: registration.scope,
      controlled: Boolean(navigator.serviceWorker.controller),
    };
  });

  expect(state.supported).toBe(true);
  expect(state.active).toBe('activated');
  expect(state.controlled).toBe(true);
  expect(new URL(state.scope).pathname).toBe('/');
});

test('alteração feita pela interface permanece após recarregar', async ({ page }) => {
  await openInstalled(page);
  const target = page.locator('[data-model="targetProfit"]');
  await expect(target).toBeVisible();
  await target.evaluate(element => {
    element.value = '5200';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').targetProfit, STORAGE_KEY)).toBe(5200);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('[data-model="targetProfit"]')).toHaveValue('5200');
  await expect(page.locator('#targetProfitDisplay')).toContainText('5.200');
});
