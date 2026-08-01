from pathlib import Path
import re
import shutil

RELEASE = "3.5.1"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"


def read(path: Path) -> str:
    if not path.is_file():
        raise SystemExit(f"Arquivo obrigatório ausente: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir()

ui_files = [ROOT / "parts" / f"ui-{index:02d}.part" for index in range(1, 5)]
app_files = [ROOT / "parts" / f"app-{index:02d}.part" for index in range(1, 10)]
# Somente evoluções funcionais. patch-07 e patch-08 eram recuperações que
# reinstalavam renderização/listeners e não pertencem ao produto consolidado.
app_files += [ROOT / "parts" / f"patch-{index:02d}.part" for index in range(1, 7)]

ui = "".join(read(path) for path in ui_files)
source = "".join(read(path) for path in app_files)

# A versão pública é definida uma única vez. As antigas constantes internas
# das evoluções deixam de existir no bundle final.
source = f"const APP_RELEASE = '{RELEASE}';\n" + source
source, release_constants = re.subn(
    r"const RELEASE = '3\.\d+\.\d+';", "const RELEASE = APP_RELEASE;", source
)
if release_constants != 3:
    raise SystemExit(
        f"Esperava substituir três versões internas; substituí {release_constants}"
    )

# Não importamos mais chaves históricas. A chave atual continua preservada.
source, legacy_key_blocks = re.subn(
    r"const LEGACY_KEYS = \[[^\]]*\];", "const LEGACY_KEYS = [];", source, count=1
)
if legacy_key_blocks != 1:
    raise SystemExit("Bloco de chaves antigas não encontrado")

source = source.replace("Custos fixos migrados", "Outros custos mensais")
source = source.replace("vettaPatchStyles", "vettaFeatureStyles")

init_marker = "\napp.init();\n"
if source.count(init_marker) != 1:
    raise SystemExit(
        f"Esperava exatamente um app.init() no código-base; encontrei {source.count(init_marker)}"
    )
source = source.replace(init_marker, "\n", 1)

old_listener = "this.$('saveCostButton').addEventListener('click', () => this.saveCost());"
new_listener = (
    "this.$('saveCostButton').addEventListener('click', event => { "
    "event.preventDefault(); this.saveCost(); });"
)
if source.count(old_listener) != 1:
    raise SystemExit(
        f"Esperava exatamente um listener-base de despesa; encontrei {source.count(old_listener)}"
    )
source = source.replace(old_listener, new_listener, 1)

if source.count('<button id="saveCostButton"') != 1:
    raise SystemExit("Botão de salvar despesa não encontrado exatamente uma vez")
if source.count('<button id="closeCostModal"') != 1:
    raise SystemExit("Botão de fechar despesa não encontrado exatamente uma vez")
source = source.replace(
    '<button id="saveCostButton"', '<button type="button" id="saveCostButton"', 1
)
source = source.replace(
    '<button id="closeCostModal"', '<button type="button" id="closeCostModal"', 1
)

source += f"""

const CURRENT_STATE_VERSION = 10;
const OBSOLETE_STORAGE_KEYS = ['vetta-driver-intelligence-v2', 'vetta-state'];

const cleanCurrentCost = cost => {{
  const technicalName = /custos?\\s+fixos?\\s+(migrados?|iniciais?)/i.test(cost?.name || '');
  const technicalId = ['fixed-migrated', 'fixed-default'].includes(cost?.id);
  return {{
    ...cost,
    name: technicalName || technicalId ? 'Outros custos mensais' : cost.name,
    legacySource: false
  }};
}};

const normalizeCurrentState = app.normalizeState;
app.normalizeState = function(value) {{
  const normalized = normalizeCurrentState.call(this, value);
  normalized.costs = Array.isArray(normalized.costs) ? normalized.costs.map(cleanCurrentCost) : [];
  normalized.closings = Array.isArray(normalized.closings) ? normalized.closings : [];
  delete normalized.migrationNotice;
  normalized.version = CURRENT_STATE_VERSION;
  normalized.release = APP_RELEASE;
  return normalized;
}};

const migrateCurrentState = app.migrateLegacy;
app.migrateLegacy = function(value) {{
  return this.normalizeState(migrateCurrentState.call(this, value));
}};

const renderCurrentRelease = app.render;
app.render = function() {{
  renderCurrentRelease.call(this);
  const label = this.$('appVersionLabel');
  if (label) label.textContent = `Versão ${{APP_RELEASE}}`;
}};

const initCurrentRelease = app.init;
app.init = function() {{
  initCurrentRelease.call(this);
  OBSOLETE_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  this.state = this.normalizeState(this.state || this.cloneDefaults());
  this.save();
  this.render();
}};

window.__vettaApp = app;
app.init();
"""

index = read(ROOT / "index.html")
replacement = ui + f'\n<script src="./app.js?v={RELEASE}" defer></script>'
pattern = re.compile(
    r'<div id="appRoot">.*?</div><script src="[^"]+" defer></script>', re.S
)
index, replacements = pattern.subn(replacement, index, count=1)
if replacements != 1:
    raise SystemExit("Não foi possível substituir o carregador antigo no index.html")

service_worker = f"""const CACHE = 'vetta-v{RELEASE}';
const APP_SHELL = [
  './',
  './index.html',
  './app.js?v={RELEASE}',
  './styles.css',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', event => {{
  event.waitUntil((async () => {{
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  }})());
}});

self.addEventListener('activate', event => {{
  event.waitUntil((async () => {{
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  }})());
}});

self.addEventListener('message', event => {{
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
}});

self.addEventListener('fetch', event => {{
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {{
    try {{
      const response = await fetch(event.request, {{ cache: 'no-store' }});
      if (response.ok) {{
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }}
      return response;
    }} catch (error) {{
      const cached = await caches.match(event.request, {{ ignoreSearch: true }});
      if (cached) return cached;
      if (event.request.mode === 'navigate') {{
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }}
      throw error;
    }}
  }})());
}});
"""

(OUTPUT / "index.html").write_text(index, encoding="utf-8")
(OUTPUT / "app.js").write_text(source, encoding="utf-8")
(OUTPUT / "sw.js").write_text(service_worker, encoding="utf-8")

for filename in ("styles.css", "manifest.webmanifest", "icon.svg", ".nojekyll", "netlify.toml"):
    source_file = ROOT / filename
    if source_file.exists():
        shutil.copy2(source_file, OUTPUT / filename)

print(f"VETTA {RELEASE} gerado em {OUTPUT}")
