import { test, expect } from '@playwright/test';

const STATE_KEY = 'vetta-driver-intelligence-v3';
const configuredState = {
  version: 10,
  release: '3.5.1',
  onboardingComplete: true,
  targetProfit: 4000,
  workWeekdays: [1, 2, 3, 4, 5, 6],
  extraDaysOff: 0,
  revenueKm: 2.25,
  fuel: { type: 'gnv', label: 'GNV', unit: 'm³', price: 4.79, efficiency: 13.2 },
  compare: { gasPrice: 6.19, gasEff: 10.5, gnvPrice: 4.79, gnvEff: 13.2, period: 1 },
  costs: [
    { id: 'maintenance-default', name: 'Reserva de manutenção', kind: 'per_km', category: 'reserve', value: 0.18, active: true },
    { id: 'fixed-default', name: 'Outros custos mensais', kind: 'monthly', category: 'obligation', value: 650, active: true },
  ],
  records: [],
  events: [],
  closings: [],
};

test.use({ viewport: { width: 390, height: 844 } });

async function openInstalled(page) {
  await page.addInitScript(({ stateKey, state }) => {
    window.__VETTA_PWA_TEST_MODE__ = 'installed';
    localStorage.setItem(stateKey, JSON.stringify(state));
  }, { stateKey: STATE_KEY, state: configuredState });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-vetta-original-dashboard', 'ready');
}

test('visão geral preserva a identidade visual original aprovada', async ({ page }) => {
  await openInstalled(page);

  const dashboard = page.locator('#view-dashboard');
  await expect(dashboard).toHaveAttribute('data-vetta-visual-baseline', '889d8d5');

  const header = page.locator('.vetta-original-header');
  await expect(header.locator('.vetta-original-logo')).toHaveText('V');
  await expect(header).toContainText('VETTA');
  await expect(header).toContainText('DRIVER INTELLIGENCE');
  await expect(header.locator('#installButton')).toContainText('Instalar');

  const hero = page.locator('.vetta-original-hero');
  await expect(hero).toContainText('Meta diária de faturamento');
  await expect(hero).toContainText('Lucro líquido diário');
  await expect(hero).toContainText('Rodagem diária');
  await expect(hero).not.toContainText('Líquido planejado');
  await expect(hero).not.toContainText('Rodagem estimada');
  await expect(page.locator('#navFuelPrice')).toBeHidden();
  await expect(page.locator('#heroStatus')).toBeHidden();

  const objective = page.locator('.vetta-original-objective');
  await expect(objective).toContainText('Objetivo mensal');
  await expect(objective).toContainText('Ajuste quanto deseja colocar no bolso.');
  await expect(objective).toContainText('Lucro líquido');
  await expect(objective).toContainText('R$ 4.000');
  await expect(objective.locator('[data-days="6"]')).toHaveClass(/active/);

  const distribution = page.locator('.vetta-original-distribution');
  await expect(distribution).toContainText('Distribuição mensal');
  await expect(distribution).toContainText('Estimativa de custos para alcançar a meta.');
  await expect(distribution.locator('.vetta-original-distribution-bar')).toBeVisible();
  await expect(distribution).toContainText('Manutenção');
  await expect(distribution).toContainText('Fixos');

  const order = await dashboard.evaluate(element => [...element.children].map(child => {
    if (child.classList.contains('vetta-original-hero')) return 'hero';
    if (child.classList.contains('vetta-original-objective')) return 'objective';
    if (child.classList.contains('vetta-original-distribution')) return 'distribution';
    return 'other';
  }).slice(0, 3));
  expect(order).toEqual(['hero', 'objective', 'distribution']);

  const visual = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const heroStyle = getComputedStyle(document.querySelector('.vetta-original-hero'));
    const heroBox = document.querySelector('.vetta-original-hero').getBoundingClientRect();
    const objectiveBox = document.querySelector('.vetta-original-objective').getBoundingClientRect();
    return {
      fontFamily: body.fontFamily,
      backgroundImage: heroStyle.backgroundImage,
      borderRadius: heroStyle.borderRadius,
      paddingTop: heroStyle.paddingTop,
      heroWidth: Math.round(heroBox.width),
      objectiveWidth: Math.round(objectiveBox.width),
    };
  });
  expect(visual.fontFamily).toMatch(/Inter|system-ui/);
  expect(visual.backgroundImage).toContain('radial-gradient');
  expect(visual.backgroundImage).toContain('linear-gradient');
  expect(visual.borderRadius).toBe('30px');
  expect(visual.paddingTop).toBe('27px');
  expect(visual.heroWidth).toBe(354);
  expect(visual.objectiveWidth).toBe(354);

  const visibleTabs = page.locator('.vetta-original-nav .nav-item:visible');
  await expect(visibleTabs).toHaveCount(3);
  const tabsInVisualOrder = await visibleTabs.evaluateAll(buttons => buttons
    .map(button => ({
      text: button.textContent.trim(),
      left: button.getBoundingClientRect().left,
    }))
    .sort((a, b) => a.left - b.left)
    .map(item => item.text));
  expect(tabsInVisualOrder).toEqual(['Visão geral', 'Comparar', 'Ajustes']);
});

test('estabilização visual mantém acesso ao registro diário e ao histórico', async ({ page }) => {
  await openInstalled(page);

  await page.locator('.vetta-original-day-action').click();
  await expect(page.locator('#view-day')).toBeVisible();

  await page.locator('.vetta-original-nav [data-view="dashboard"]').click();
  await expect(page.locator('#view-dashboard')).toBeVisible();
  await page.locator('#vettaHistoryAction').click();
  await expect(page.locator('#view-history')).toBeVisible();
});
