(async () => {
  const RELEASE = '3.5.0';
  const UI_PARTS = [
    './parts/ui-01.part',
    './parts/ui-02.part',
    './parts/ui-03.part',
    './parts/ui-04.part'
  ];
  const SOURCE_PARTS = [
    './parts/app-01.part',
    './parts/app-02.part',
    './parts/app-03.part',
    './parts/app-04.part',
    './parts/app-05.part',
    './parts/app-06.part',
    './parts/app-07.part',
    './parts/app-08.part',
    './parts/app-09.part',
    './parts/patch-01.part',
    './parts/patch-02.part',
    './parts/patch-03.part',
    './parts/patch-04.part',
    './parts/patch-05.part',
    './parts/patch-06.part'
  ];

  const fetchText = async path => {
    const response = await fetch(`${path}?v=${RELEASE}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Falha ao carregar ${path}`);
    return response.text();
  };

  const [ui, rawSource] = await Promise.all([
    Promise.all(UI_PARTS.map(fetchText)).then(parts => parts.join('')),
    Promise.all(SOURCE_PARTS.map(fetchText)).then(parts => parts.join(''))
  ]);

  const root = document.getElementById('appRoot');
  if (!root) throw new Error('Raiz do aplicativo não encontrada');
  root.outerHTML = ui;

  let source = rawSource;
  const initMarker = '\napp.init();\n';
  const initCount = source.split(initMarker).length - 1;
  if (initCount !== 1) {
    throw new Error(`Inicialização inconsistente: ${initCount} chamadas encontradas`);
  }
  source = source.replace(initMarker, '\n');

  const oldSaveListener = "this.$('saveCostButton').addEventListener('click', () => this.saveCost());";
  const newSaveListener = "this.$('saveCostButton').addEventListener('click', event => { event.preventDefault(); this.saveCost(); });";
  if (!source.includes(oldSaveListener)) throw new Error('Listener-base de despesas não encontrado');
  source = source.replace(oldSaveListener, newSaveListener);
  source = source.replace('<button id="saveCostButton"', '<button type="button" id="saveCostButton"');
  source = source.replace('<button id="closeCostModal"', '<button type="button" id="closeCostModal"');

  if (!source.includes('const app = {')) throw new Error('Objeto principal do VETTA não encontrado');
  source = source.replace('const app = {', 'const app = window.__vettaApp = {');

  source += `
const APP_RELEASE = '${RELEASE}';
const CURRENT_STATE_VERSION = 9;
const OBSOLETE_STORAGE_KEYS = ['vetta-driver-intelligence-v2', 'vetta-state'];

const cleanCurrentCost = cost => {
  const technicalName = /custos?\\s+fixos?\\s+(migrados?|iniciais?)/i.test(cost?.name || '');
  const technicalId = ['fixed-migrated', 'fixed-default'].includes(cost?.id);
  return {
    ...cost,
    name: technicalName || technicalId ? 'Outros custos mensais' : cost.name,
    legacySource: false
  };
};

const normalizeCurrentState = app.normalizeState;
app.normalizeState = function(value) {
  const normalized = normalizeCurrentState.call(this, value);
  normalized.costs = Array.isArray(normalized.costs) ? normalized.costs.map(cleanCurrentCost) : [];
  normalized.closings = Array.isArray(normalized.closings) ? normalized.closings : [];
  delete normalized.migrationNotice;
  normalized.version = CURRENT_STATE_VERSION;
  normalized.release = APP_RELEASE;
  return normalized;
};

const renderCurrentRelease = app.render;
app.render = function() {
  renderCurrentRelease.call(this);
  const label = this.$('appVersionLabel');
  if (label) label.textContent = \`Versão \${APP_RELEASE}\`;
};

window.__vettaApp = app;
app.init();
OBSOLETE_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
`;

  new Function(source)();
})().catch(error => {
  console.error('Falha ao iniciar o VETTA', error);
  document.body.innerHTML = `
    <main style="max-width:520px;margin:60px auto;padding:24px;font-family:system-ui">
      <h1>Não foi possível carregar o VETTA</h1>
      <p>Atualize a página com internet para concluir a atualização.</p>
    </main>`;
});
