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

**Status:** concluída no ambiente de desenvolvimento do PR #18.

**Commit publicado:** `5c8124e115a52186d813c13f1a26898547bf9df0`

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

## Próxima fase — Fase 3: Onboarding

Escopo definido no plano:

- fluxo completo;
- salvar progresso;
- permitir refazer sem apagar registros;
- primeira meta;
- primeira ação;
- teste com usuário real;
- permitir voltar e pular campos opcionais;
- não bloquear o uso indevidamente.

A Fase 3 deve começar por uma auditoria do onboarding atual e por testes que caracterizem o que já funciona antes das alterações.
