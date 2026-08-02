# VETTA — Status de execução do plano

Este arquivo acompanha a execução de `docs/PLANO-DE-APLICACAO.md` sem alterar a definição original das fases.

## Fase 1 — Fundação modular

**Status:** implementada no PR #17; ainda não integrada à `main`.

Evidência principal:

- manifesto e registro de módulos;
- feature flags;
- barramento de eventos;
- diagnósticos;
- testes da fundação modular.

## Fase 2 — Linguagem didática

**Status:** concluída tecnicamente no ambiente de desenvolvimento do PR #18.

**Commit funcional publicado:** `5c8124e115a52186d813c13f1a26898547bf9df0`

Entregas concluídas:

- substituição de termos como “rendimento”, “receita/km”, “meta líquida” e “projeção” nas principais jornadas;
- perguntas completas nos campos de configuração;
- unidades visíveis para litro, m³ de GNV, quilômetro e valores monetários;
- exemplos práticos junto aos campos;
- mensagens que indicam exatamente o dado que precisa ser corrigido;
- glossário curto dentro das configurações;
- linguagem didática no onboarding, registro diário, configurações, simulador e relatório;
- módulo de linguagem separado do gate de instalação.

Validação humana ainda necessária:

- observar um motorista novo preenchendo a configuração sem orientação verbal;
- registrar dúvidas, hesitações e termos ainda pouco claros.

## Fase 3 — Onboarding

**Status:** concluída tecnicamente no ambiente de desenvolvimento do PR #19.

**Commit publicado:** `58fc6f27000f0329b5644f55564742720d2a02be`

Entregas concluídas:

- rascunho separado do estado financeiro oficial;
- progresso salvo automaticamente no aparelho;
- retomada no passo e nos valores exatos após fechar ou recarregar;
- opção `Fazer depois`, sem bloquear o restante do aplicativo;
- navegação de volta com progresso preservado;
- opção para pular os campos opcionais;
- possibilidade de refazer a configuração pelas Configurações;
- preservação de registros, eventos, fechamentos e custos criados pelo motorista;
- substituição apenas dos custos gerados pelo próprio onboarding;
- confirmação da primeira meta;
- orientação direta para registrar o primeiro dia.

Validação humana ainda necessária:

- acompanhar uma pessoa nova concluindo ou adiando o onboarding;
- verificar se a primeira ação é compreendida sem orientação verbal;
- observar se o cartão de retomada é percebido com facilidade.

## Fase 4 — Consolidação Vite

**Status:** em andamento no PR #20. Primeiro corte vertical concluído e publicado.

**Commit publicado:** `914d9fa9241289ee5dc785204a7d31c8644fe390`

Entregas concluídas neste corte:

- Vite configurado com base relativa e saída `dist`;
- GitHub Pages alterado para publicar o `dist` verificado;
- entrada única do runtime Vite, carregada depois da aplicação legada;
- ordem explícita de inicialização para linguagem, onboarding e instalação;
- domínio financeiro puro extraído para `src/domain/finance`;
- adaptador de armazenamento desacoplado em `src/storage`;
- comparação automática entre cálculos modulares e cálculos legados;
- comparação automática entre estado persistido e estado em memória;
- preservação de `app.js` como fallback durante a migração;
- verificador estrutural do artefato `dist`;
- suíte herdada executada integralmente contra `dist`.

Evidência automatizada do corte:

- 4 testes do domínio financeiro;
- 4 testes do contrato de armazenamento;
- checks herdados das fases 1, 2 e 3;
- build Vite e verificação estrutural do `dist`;
- gate de instalação aprovado no `dist`;
- linguagem didática aprovada no `dist`;
- onboarding persistente aprovado no `dist`;
- paridade financeira e de armazenamento aprovada em execução;
- identificação do build e módulos herdados aprovada;
- publicação de `dist` em `gh-pages` aprovada;
- `dev-build.json` confirmou `buildSystem: vite`, branch, PR e SHA.

Ainda falta para concluir a Fase 4:

- migrar as telas para módulos reais;
- fazer os consumidores oficiais usarem o domínio e o armazenamento novos;
- reduzir progressivamente as responsabilidades de `app.js`;
- remover o legado somente após paridade e rollback comprovados;
- executar nova validação visual em aparelhos físicos.

## Próximo corte da Fase 4

Migrar uma tela completa — começando pelo registro diário — para uma fronteira modular que consuma o domínio e o armazenamento novos, mantendo comparação e rollback para o fluxo legado.
