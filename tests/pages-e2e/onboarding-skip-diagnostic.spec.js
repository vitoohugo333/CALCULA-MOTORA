import { test, expect } from '@playwright/test';

const STATE_KEY = 'vetta-driver-intelligence-v3';
const PROGRESS_KEY = 'vetta-onboarding-progress-v1';

test('diagnostica o clique de pular opcionais', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.__VETTA_PWA_TEST_MODE__ = 'installed';
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#onboardingTarget').fill('4800');
  await page.locator('#onboardingNext').click();
  await page.locator('#onboardingFuelType').selectOption('gnv');
  await page.locator('#onboardingFuelPrice').fill('4.90');
  await page.locator('#onboardingFuelEff').fill('13');
  await page.locator('#onboardingNext').click();

  const before = await page.evaluate(({ stateKey, progressKey }) => ({
    state: localStorage.getItem(stateKey),
    progress: localStorage.getItem(progressKey),
    step: window.__vettaApp?.onboardingStep,
    button: Boolean(document.getElementById('onboardingSkipOptional')),
  }), { stateKey: STATE_KEY, progressKey: PROGRESS_KEY });
  console.log('[SKIP_BEFORE]', JSON.stringify(before));

  await page.locator('#onboardingSkipOptional').click();
  await page.waitForTimeout(250);

  const after = await page.evaluate(({ stateKey, progressKey }) => ({
    state: localStorage.getItem(stateKey),
    progress: localStorage.getItem(progressKey),
    step: window.__vettaApp?.onboardingStep,
    modalHidden: document.getElementById('onboardingModal')?.classList.contains('hidden'),
    firstAction: Boolean(document.getElementById('onboardingFirstAction')),
    toast: document.getElementById('toast')?.textContent,
  }), { stateKey: STATE_KEY, progressKey: PROGRESS_KEY });
  console.log('[SKIP_AFTER]', JSON.stringify(after));
  console.log('[SKIP_ERRORS]', JSON.stringify(errors));

  expect(errors).toEqual([]);
  expect(after.firstAction).toBe(true);
});
