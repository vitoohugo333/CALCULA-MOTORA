import { test, expect } from '@playwright/test';

const STATE_KEY = 'vetta-driver-intelligence-v3';
const PROGRESS_KEY = 'vetta-onboarding-progress-v1';

const configuredState = {
  version: 10,
  release: '3.5.1',
  onboardingComplete: true,
  targetProfit: 4000,
  workWeekdays: [1, 2, 3, 4, 5, 6],
  extraDaysOff: 0,
  revenueKm: 2.25,
  fuel: { type: 'gasoline', label: 'Gasolina', unit: 'L', price: 6.19, efficiency: 10.5 },
  compare: { gasPrice: 6.19, gasEff: 10.5, gnvPrice: 4.79, gnvEff: 13.2, period: 1 },
  costs: [
    { id: 'user-insurance', name: 'Seguro próprio', kind: 'monthly', category: 'obligation', value: 210, active: true },
    { id: 'maintenance-onboarding', name: 'Reserva antiga', kind: 'per_km', category: 'reserve', value: 0.1, active: true },
  ],
  records: [{ date: '2026-08-01', gross: 200, km: 100, hours: 8, fuelSpend: 50 }],
  events: [{ id: 'event-1', title: 'Evento salvo', date: '2026-08-03', category: 'event' }],
  closings: [{ month: '2026-07', closedAt: '2026-08-01T00:00:00.000Z' }],
};

async function openInstalled(page, state) {
  await page.addInitScript(({ stateKey, storedState }) => {
    window.__VETTA_PWA_TEST_MODE__ = 'installed';
    if (storedState) localStorage.setItem(stateKey, JSON.stringify(storedState));
  }, { stateKey: STATE_KEY, storedState: state });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-vetta-onboarding-experience', 'ready');
}

async function completeRequiredSteps(page, target = '5000') {
  await page.locator('#onboardingTarget').fill(target);
  await page.locator('#onboardingNext').click();
  await page.locator('#onboardingFuelType').selectOption('gnv');
  await page.locator('#onboardingFuelPrice').fill('4.90');
  await page.locator('#onboardingFuelEff').fill('13');
  await page.locator('#onboardingNext').click();
}

test('salva o progresso, libera o uso e retoma exatamente do ponto salvo', async ({ page }) => {
  await openInstalled(page, null);
  const modal = page.locator('#onboardingModal');
  await expect(modal).toBeVisible();

  await page.locator('#onboardingTarget').fill('5200');
  await page.locator('[data-onboarding-days="5"]').click();
  await page.locator('#onboardingNext').click();
  await page.locator('#onboardingFuelType').selectOption('gasoline');
  await page.locator('#onboardingFuelPrice').fill('6.25');
  await page.locator('#onboardingFuelEff').fill('10.7');
  await page.locator('#onboardingNext').click();
  await page.locator('#onboardingRevenue').fill('2.45');
  await page.locator('#onboardingLater').click();

  await expect(modal).toBeHidden();
  await expect(page.locator('#onboardingResumeCard')).toContainText('Você parou na etapa 3 de 3');
  await page.locator('[data-view="day"]').first().click();
  await expect(page.locator('#view-day')).toBeVisible();

  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PROGRESS_KEY);
  expect(saved).toMatchObject({ step: 3, dismissed: true, target: 5200, days: 5, fuelType: 'gasoline', revenueKm: 2.45 });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#onboardingModal')).toBeHidden();
  await expect(page.locator('#onboardingResumeCard')).toBeVisible();
  await page.locator('#resumeOnboardingButton').click();
  await expect(page.locator('#onboardingModal')).toBeVisible();
  await expect(page.locator('#onboardingStep3')).toBeVisible();
  await expect(page.locator('#onboardingTarget')).toHaveValue('5200');
  await expect(page.locator('#onboardingRevenue')).toHaveValue('2.45');
});

test('permite voltar e atualiza a etapa salva', async ({ page }) => {
  await openInstalled(page, null);
  await page.locator('#onboardingTarget').fill('4300');
  await page.locator('#onboardingNext').click();
  await expect(page.locator('#onboardingStep2')).toBeVisible();
  await page.locator('#onboardingBack').click();
  await expect(page.locator('#onboardingStep1')).toBeVisible();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PROGRESS_KEY);
  expect(saved.step).toBe(1);
  expect(saved.target).toBe(4300);
});

test('pula os campos opcionais e orienta o primeiro registro', async ({ page }) => {
  await openInstalled(page, null);
  await completeRequiredSteps(page, '4800');
  await expect(page.locator('#onboardingStep3')).toBeVisible();
  await page.locator('#onboardingSkipOptional').click();

  const firstAction = page.locator('#onboardingFirstAction');
  await expect(firstAction).toBeVisible();
  await expect(firstAction).toContainText('Sua primeira meta está pronta');
  await expect(firstAction).toContainText('R$ 4.800');
  await expect(firstAction).toContainText('Registrar meu primeiro dia');
  expect(await page.evaluate(key => localStorage.getItem(key), PROGRESS_KEY)).toBeNull();

  const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STATE_KEY);
  expect(state.onboardingComplete).toBe(true);
  expect(state.targetProfit).toBe(4800);
  expect(state.revenueKm).toBe(2.25);

  await page.locator('#onboardingFirstActionPrimary').click();
  await expect(page.locator('#view-day')).toBeVisible();
  await expect(page.locator('#recordGross')).toBeFocused();
});

test('refaz a configuração sem apagar registros, eventos ou custos do usuário', async ({ page }) => {
  await openInstalled(page, configuredState);
  await page.locator('[data-view="settings"]').first().click();
  await expect(page.locator('#restartOnboardingCard')).toBeVisible();
  await page.locator('#restartOnboardingButton').click();

  await completeRequiredSteps(page, '6100');
  await page.locator('#onboardingRevenue').fill('2.60');
  await page.locator('#onboardingFixed').fill('750');
  await page.locator('#onboardingNext').click();

  const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STATE_KEY);
  expect(state.targetProfit).toBe(6100);
  expect(state.revenueKm).toBe(2.6);
  expect(state.records).toEqual(configuredState.records);
  expect(state.events).toEqual(configuredState.events);
  expect(state.closings).toEqual(configuredState.closings);
  expect(state.costs.some(cost => cost.id === 'user-insurance' && cost.value === 210)).toBe(true);
  expect(state.costs.filter(cost => cost.id === 'maintenance-onboarding')).toHaveLength(1);
  expect(state.costs.some(cost => cost.id === 'fixed-onboarding' && cost.value === 750)).toBe(true);
});
