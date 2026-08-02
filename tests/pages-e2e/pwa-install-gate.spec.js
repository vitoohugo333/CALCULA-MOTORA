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

async function openInstalled(page, state = installedState) {
  page.on('pageerror', error => console.log(`[PAGE_ERROR] ${error.stack || error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') console.log(`[BROWSER_ERROR] ${message.text()}`);
  });
  await page.addInitScript(({ key, storedState }) => {
    window.__VETTA_PWA_TEST_MODE__ = 'installed';
    if (storedState) localStorage.setItem(key, JSON.stringify(storedState));
  }, { key: STORAGE_KEY, storedState: state });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-vetta-pwa-gate', 'unlocked');
  await expect(page.locator('html')).toHaveAttribute('data-vetta-didactic-language', 'ready');
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

test('configurações mostram perguntas, unidades, exemplos e glossário', async ({ page }) => {
  await openInstalled(page);
  await page.locator('[data-view="settings"]').first().click();

  const settings = page.locator('#view-settings');
  await expect(settings).toContainText('Combustível usado nos cálculos');
  await expect(settings).toContainText('Quanto custa 1 litro?');
  await expect(settings).toContainText('Quantos quilômetros o veículo faz com 1 litro?');
  await expect(settings).toContainText('se percorre aproximadamente 10 km');
  await expect(settings).toContainText('Quanto você recebe por km rodado?');
  await expect(settings).toContainText('R$ 240 recebidos ÷ 120 km rodados');
  await expect(settings).toContainText('Contas e dinheiro reservado');
  await expect(page.locator('#didacticGlossary')).toHaveCount(1);
  await page.locator('#didacticGlossary summary').click();
  await expect(page.locator('#didacticGlossary')).toContainText('Valor que você deseja ter depois de pagar os custos');
  await expect(settings).not.toContainText(/Rendimento|Receita\/km|Meta líquida|\bProjeção\b/i);
});

test('registro diário aponta exatamente o campo que precisa ser corrigido', async ({ page }) => {
  await openInstalled(page);
  await page.locator('[data-view="day"]').first().click();

  await page.locator('#recordGross').fill('0');
  await page.locator('#recordKm').fill('0');
  await page.locator('#saveDayButton').click();
  await expect(page.locator('#toast')).toHaveText('Informe quanto você recebeu no dia.');

  await page.locator('#recordGross').fill('150');
  await page.locator('#saveDayButton').click();
  await expect(page.locator('#toast')).toHaveText('Informe quantos quilômetros você rodou.');
});

test('novo usuário recebe onboarding autoexplicativo sem o termo rendimento', async ({ page }) => {
  await openInstalled(page, null);

  const onboarding = page.locator('#onboardingModal');
  await expect(onboarding).toBeVisible();
  await expect(onboarding).toContainText('Quanto você quer que sobre?');
  await expect(onboarding).toContainText('Quanto você quer que sobre por mês?');
  await expect(onboarding).toContainText('depois de pagar os custos do trabalho');

  await page.locator('#onboardingTarget').fill('0');
  await page.locator('#onboardingNext').click();
  await expect(page.locator('#toast')).toHaveText('Informe quanto você quer que sobre por mês.');

  await page.locator('#onboardingTarget').fill('4000');
  await page.locator('#onboardingNext').click();
  await page.locator('#onboardingFuelType').selectOption('gnv');
  await expect(onboarding).toContainText('Quanto custa 1 m³ de GNV?');
  await expect(onboarding).toContainText('Quantos quilômetros o veículo faz com 1 m³ de GNV?');
  await expect(onboarding).not.toContainText(/Rendimento/i);
});

test('simulador e relatório não voltam à linguagem técnica', async ({ page }) => {
  await openInstalled(page);
  await page.locator('[data-view="more"]').first().click();
  await page.locator('#compareDetails summary').click();

  const compare = page.locator('#compareDetails');
  await expect(compare).toContainText('Quanto custa 1 litro de gasolina?');
  await expect(compare).toContainText('Quantos km faz com 1 m³ de GNV?');
  await expect(compare).toContainText('Economia estimada');
  await expect(page.locator('#chartTitle')).toContainText('Estimativa');
  await expect(compare).not.toContainText(/Rendimento|Meta líquida|\bProjeção\b/i);

  await page.evaluate(() => {
    window.print = () => { window.__vettaPrintRequested = true; };
  });
  await page.locator('#reportButton').click();
  const report = page.locator('#reportSheet');
  await expect(report).toContainText('Quanto você quer que sobre');
  await expect(report).toContainText('Quanto já sobrou');
  await expect(report).toContainText('Média recebida por km');
  await expect(report).toContainText('Estimativa para o fim do mês');
  await expect(report).not.toContainText(/Meta líquida|Líquido realizado|Receita média\/km|Projeção mensal/);
  await expect.poll(() => page.evaluate(() => window.__vettaPrintRequested)).toBe(true);
});

test('modo instalado preserva o aplicativo e os dados existentes', async ({ page }) => {
  await openInstalled(page);
  await expect(page.locator('#vettaPwaInstallGate')).toHaveCount(0);
  await expect(page.locator('#targetProfitDisplay')).toContainText('R$ 4.000');
  await expect(page.locator('body')).toContainText('Quanto você quer que sobre no mês');
});
