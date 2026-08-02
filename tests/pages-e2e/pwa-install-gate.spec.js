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

async function emulateIphone(page, browserToken = 'Version/18.0') {
  await page.addInitScript(token => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () => `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 ${token} Mobile/15E148 Safari/604.1`,
    });
    Object.defineProperty(navigator, 'platform', { configurable: true, get: () => 'iPhone' });
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, get: () => 5 });
  }, browserToken);
}

test('bloqueia o conteúdo até o aplicativo ser aberto pelo ícone instalado', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const gate = page.locator('#vettaPwaInstallGate');
  await expect(gate).toBeVisible();
  await expect(gate).toContainText('Instale o VETTA para continuar');
  await expect(page.locator('main')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-vetta-pwa-gate', 'locked');
  await expect(gate).not.toContainText(/PWA|offline|navegador|\baba\b/i);
  await expect(page.locator('#vettaPwaGateCheck')).toHaveCount(0);
});

test('mostra no Safari do iPhone o fluxo aprovado de instalação como aplicativo', async ({ page }) => {
  await emulateIphone(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const gate = page.locator('#vettaPwaInstallGate');
  await expect(gate).toContainText('Instale o VETTA no seu iPhone');
  await expect(gate).toContainText('No iPhone, a instalação é feita pela opção “Adicionar à Tela de Início”.');
  await expect(gate).toContainText('funcionará normalmente, como qualquer aplicativo');
  await expect(gate).toContainText('Instala o aplicativo');
  await expect(gate).toContainText('Ícone próprio na Tela de Início');
  await expect(gate).toContainText('Você só precisa instalar uma vez');
  await expect(gate.locator('.pwa-gate-instructions li')).toHaveCount(4);
  await expect(gate).toContainText('Toque em Compartilhar.');
  await expect(gate).toContainText('Confirme em “Adicionar”.');
  await expect(gate).toContainText('Importante:');
  await expect(gate).toContainText('feche esta tela e abra o VETTA pelo ícone criado');
  await expect(page.locator('#vettaPwaGateAction')).toHaveCount(0);
  await expect(gate).not.toContainText(/PWA|offline|navegador|\baba\b/i);
});

test('oferece fallback curto quando o iPhone não está no Safari', async ({ page }) => {
  await emulateIphone(page, 'CriOS/140.0');
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const gate = page.locator('#vettaPwaInstallGate');
  await expect(gate).toContainText('Instale o VETTA no seu iPhone');
  await expect(gate).toContainText('Se a opção não aparecer, abra esta página no Safari.');
  await expect(page.locator('#vettaPwaGateAction')).toHaveText('Copiar endereço para abrir no Safari');
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
