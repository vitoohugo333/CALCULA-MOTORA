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

Evidência automatizada:

- 5 testes da fundação modular;
- 7 testes da instalação obrigatória;
- 6 testes unitários do contrato de linguagem;
- 8 cenários de navegador cobrindo instalação, onboarding, configuração, erros, simulador, relatório e preservação de dados;
- publicação automática na branch `gh-pages`.

Validação humana ainda necessária:

- observar um motorista novo preenchendo a configuração sem orientação verbal;
- registrar dúvidas, hesitações e termos ainda pouco claros.

## Fase 3 — Onboarding

**Status:** concluída tecnicamente no ambiente de desenvolvimento do PR #19.

**Commit publicado:** `58fc6f27000f0329b5644f55564742720d2a02be`

Entregas concluídas:

- auditoria do fluxo anterior antes das alterações;
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
- orientação direta para registrar o primeiro dia;
- correção do contrato de rótulos para preservar elementos internos usados pelo aplicativo.

Evidência automatizada:

- 6 testes unitários do núcleo do onboarding;
- 12 cenários finais de navegador somando instalação, linguagem e onboarding;
- teste direto de retomada após recarregar;
- teste de preservação de registros, eventos, fechamentos e custos do usuário;
- teste de campos opcionais e primeira ação;
- workflow de verificação aprovado;
- publicação automática em `gh-pages` aprovada;
- `dev-build.json` confirmou branch, PR e SHA publicados.

Validação humana ainda necessária:

- acompanhar uma pessoa nova concluindo ou adiando o onboarding;
- verificar se a primeira ação é compreendida sem orientação verbal;
- observar se o cartão de retomada é percebido com facilidade.

## Próxima fase — Fase 4: Consolidação Vite

Escopo definido no plano:

- domínio financeiro modular;
- armazenamento desacoplado;
- telas por módulo;
- build `dist`;
- paridade funcional;
- remoção gradual do legado.

A Fase 4 deve começar por caracterização do comportamento atual, definição das fronteiras do domínio e introdução de um build Vite sem remover a entrada legada até existir paridade comprovada.
