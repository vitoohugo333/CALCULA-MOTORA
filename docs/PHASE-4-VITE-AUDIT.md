# Fase 4 — Contrato de migração para Vite

## Objetivo

Introduzir uma base Vite e módulos reais sem interromper o aplicativo legado antes da paridade comprovada.

## Estado inicial

- entrada principal: `index.html`;
- aplicação concentrada em `app.js`;
- persistência direta em `localStorage`;
- scripts de experiência injetados no artefato do GitHub Pages;
- build de desenvolvimento montado por `scripts/prepare-pages.mjs`;
- testes de navegador executados sobre `_site`.

## Fronteiras a extrair

1. **Domínio financeiro**
   - custo de combustível por km;
   - custos mensais e por km;
   - meta bruta e líquida;
   - resultados diário, semanal e mensal;
   - estimativas e comparações.

2. **Armazenamento**
   - leitura e gravação do estado;
   - versionamento;
   - validação;
   - importação e exportação;
   - rascunhos separados.

3. **Telas e módulos**
   - painel;
   - registro diário;
   - histórico;
   - configurações;
   - simuladores e relatórios;
   - onboarding.

## Estratégia de compatibilidade

- o legado permanece executável durante a migração;
- módulos novos devem ser funções puras ou adaptadores independentes;
- o build Vite precisa gerar `dist` antes de qualquer remoção;
- a suíte atual deve executar contra `dist`;
- cada cálculo migrado terá teste de paridade com exemplos conhecidos;
- armazenamento novo precisa ler o formato existente;
- nenhuma migração pode apagar ou reinterpretar dados silenciosamente.

## Primeiro corte vertical

- configurar Vite;
- gerar `dist` com todos os recursos necessários;
- extrair domínio financeiro mínimo e adaptador de armazenamento;
- usar os módulos novos em modo de comparação, sem substituir o cálculo oficial;
- falhar o check quando houver divergência;
- manter `_site` temporariamente como fallback até o build Vite provar paridade.

## Critério para avançar

O primeiro corte está concluído quando:

- `npm run build` gera `dist`;
- o aplicativo abre a partir de `dist`;
- os testes existentes passam contra `dist`;
- cálculos de domínio possuem testes unitários;
- armazenamento possui contrato e testes;
- nenhuma entrada de produção foi removida.
