# VETTA — Contrato de módulos

## Objetivo

A fundação modular da Fase 1 permite registrar, ativar, desativar, testar e remover funcionalidades sem reescrever o núcleo ou alterar os dados oficiais por acidente.

## Componentes

- `src/platform/manifest.js`: valida metadados e contratos.
- `src/platform/module-registry.js`: controla dependências e ciclo de vida.
- `src/platform/event-bus.js`: comunicação desacoplada com falhas isoladas.
- `src/platform/feature-flags.js`: habilitação controlada de experiências.
- `src/platform/diagnostics.js`: diagnóstico serializável.
- `src/app/platform-runtime.js`: composição da plataforma.
- `src/modules/platform-demo/`: prova removível da arquitetura.

## Estados de execução

- `registered`: registrado e inativo;
- `enabling`: ativação em andamento;
- `enabled`: ativo;
- `disabling`: desativação em andamento;
- `error`: falha de ciclo de vida.

O estado de produto do manifesto é independente e pode ser `core`, `stable`, `optional`, `experimental` ou `deprecated`.

## Experimentos

Todo módulo experimental deve ter feature flag, dados isolados quando necessário, teste de ativação e descarte, além de uma decisão futura de promoção ou remoção.

## Limite da Fase 1

A fundação é independente e testável. As telas atuais continuam no aplicativo legado até a consolidação Vite, evitando uma reescrita arriscada nesta etapa.
