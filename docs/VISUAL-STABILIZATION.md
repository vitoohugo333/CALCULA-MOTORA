# VETTA — Estabilização visual da visão geral

## Referência aprovada

A referência visual oficial é a interface implementada no commit `889d8d5f645094c57f931c145253c37a6039584b` e confirmada pela captura enviada pelo proprietário do produto.

Elementos obrigatórios da referência:

- marca com o monograma `V`;
- assinatura `DRIVER INTELLIGENCE`;
- fonte `Inter` com fallback para a fonte nativa do aparelho;
- card principal em azul-marinho com iluminação azul;
- título `Meta diária de faturamento`;
- indicadores `Lucro líquido diário` e `Rodagem diária`;
- cartão `Objetivo mensal` com a explicação `Ajuste quanto deseja colocar no bolso.`;
- cartão `Distribuição mensal`;
- navegação principal com `Visão geral`, `Comparar` e `Ajustes`.

## Marco da regressão

O primeiro artefato no qual a regressão foi percebida foi o build Vite do commit `6fabd127ee653fe614d1b30e1bd3d4281781491c`, no PR #20.

Esse commit não alterou diretamente o layout. Ele publicou a cadeia completa que carregava a camada didática sobre o dashboard e tornou a regressão visível.

## Causa raiz

A camada de linguagem didática reescrevia elementos de `#view-dashboard`, incluindo os indicadores e rótulos do card principal. Textos curtos eram transformados em frases maiores, alterando composição, altura e ritmo visual.

## Decisão estrutural

O dashboard é uma superfície visual estabilizada. A linguagem didática pode atuar em formulários, onboarding, mensagens, simulador e relatório, mas não pode reescrever os cartões da visão geral.

A apresentação original é aplicada por `src/ui/original-dashboard-view.js` e `src/ui/original-dashboard-view.css`, usando o motor e o estado atuais. O módulo compensatório que alterava e depois restaurava textos foi removido.

## Proteção automatizada

`tests/pages-e2e/dashboard-visual-stability.spec.js` verifica em viewport mobile:

- identidade da marca;
- textos exatos do card principal;
- ordem hero → objetivo → distribuição;
- família tipográfica;
- gradientes, raio e espaçamento do card principal;
- largura dos cartões;
- três abas principais;
- acesso preservado ao registro diário e histórico.

## Regra de publicação

A estabilização só é considerada concluída quando:

1. todos os checks e testes passam;
2. o build Vite é gerado e verificado;
3. a suíte completa roda contra `dist`;
4. `gh-pages/dev-build.json` aponta para o mesmo SHA final da branch de correção;
5. a validação visual no aparelho confirma a referência.
