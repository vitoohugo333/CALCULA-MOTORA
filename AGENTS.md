# VETTA — Guardrails obrigatórios de engenharia

Este arquivo é o contrato operacional do projeto. Toda execução de Codex, agente ou automação deve lê-lo antes de alterar qualquer arquivo.

## 1. Linha ativa e ambientes

- Branch ativa única: `feature/fase-2-clareza-pwa-gate`.
- Snapshot estável de referência: `e677ba8961b6381e6a50c1131e453dc7b7f9214f`.
- GitHub Pages é o único ambiente de desenvolvimento e validação.
- `main` e Netlify são produção. Não alterar, mesclar ou publicar sem autorização explícita do proprietário.
- Não criar branch, PR, migração ou experimento paralelo sem autorização explícita.

## 2. Regra de escopo

- Uma execução deve tratar apenas um comportamento observável.
- Antes de editar, declarar: objetivo, arquivos em escopo, invariantes e critérios de aceite.
- Não misturar mudança visual, refatoração, build, PWA, armazenamento e regra de negócio na mesma execução.
- Não aproveitar uma tarefa para fazer limpeza, modernização ou modularização adjacente.
- Não implementar uma etapa inteira do plano sem aprovação explícita do seu recorte.

## 3. Interface congelada

A interface existente no snapshot estável é contrato de produto.

Sem aprovação visual explícita, é proibido alterar:

- fonte, peso, escala tipográfica ou carregamento de fontes;
- largura, altura, raio, gradiente, sombra ou espaçamento do card principal;
- cabeçalho, navegação inferior, ordem das abas ou comportamento fixo da barra;
- textos do dashboard, quebras de linha ou densidade dos cartões;
- `overflow`, largura do body, viewport ou rolagem horizontal;
- estrutura do dashboard por JavaScript em tempo de execução.

Textos didáticos podem atuar somente no componente aprovado. Nunca devem percorrer ou reescrever áreas inteiras do DOM.

## 4. Proibição de remendos compensatórios

- Não criar um módulo que desfaz a alteração causada por outro módulo.
- Não corrigir regressão visual com sobrescritas globais, `!important` indiscriminado ou mutação posterior do DOM.
- Corrigir a causa na origem.
- Ao encontrar conflito arquitetural, parar e apresentar opções antes de editar.

## 5. Processo obrigatório por mudança

1. Confirmar o SHA atual da branch e o SHA publicado na `gh-pages`.
2. Reproduzir o problema ou caracterizar o comportamento atual.
3. Definir um critério de aceite verificável.
4. Alterar o menor número possível de arquivos.
5. Executar o teste focado.
6. Executar a suíte herdada relevante.
7. Publicar automaticamente na `gh-pages` somente após testes verdes.
8. Confirmar que `dev-build.json` aponta para o mesmo SHA.
9. Aguardar validação física do proprietário antes da próxima mudança visual ou de instalação.

Não iniciar a próxima alteração enquanto a anterior não tiver sido validada no aparelho.

## 6. Proteções mínimas obrigatórias

Toda alteração que possa afetar interface, PWA ou build deve provar:

- `document.documentElement.scrollWidth <= document.documentElement.clientWidth` em viewport mobile;
- nenhuma rolagem horizontal no body;
- navegação inferior visível, utilizável e com a quantidade esperada de itens;
- card principal dentro da largura da viewport;
- manifesto servido no caminho correto;
- `start_url`, `scope` e ícones válidos;
- service worker registrado sem erro;
- gate com uma ação ou instrução compatível com a plataforma detectada;
- modo instalado libera o aplicativo;
- fluxos existentes e dados locais permanecem intactos.

Testes verdes não substituem validação visual física.

## 7. Build, PWA e migrações

- Não introduzir Vite, bundler, framework, novo pipeline ou mudança de estrutura sem decisão separada e plano de rollback aprovado.
- Não mover manifesto, service worker, ícones ou arquivos do shell sem teste de instalabilidade do artefato final.
- O teste deve executar contra o mesmo diretório que será publicado.
- Não declarar PWA instalável apenas porque os arquivos existem; validar o artefato final e o comportamento real.

## 8. Git e recuperação

- Preferir poucos commits pequenos na branch ativa.
- Não reescrever histórico, mover refs ou fazer rollback sem autorização explícita.
- Antes de uma mudança de alto risco, registrar o SHA estável atual no relato da execução.
- Não apagar branches antigas ou histórico; fechar e arquivar quando necessário.
- A recuperação sempre deve partir de um SHA conhecido, nunca de reconstrução por memória.

## 9. Comunicação obrigatória

Nunca afirmar que algo está publicado, corrigido ou concluído sem evidência fresca.

Toda entrega deve informar:

- branch;
- commit;
- arquivos alterados;
- testes executados e resultado;
- SHA confirmado na `gh-pages`;
- o que permanece sem validação física;
- confirmação de que `main` e Netlify não foram alterados.

## 10. Regra de parada

Parar imediatamente e pedir decisão quando:

- o escopo crescer além do comportamento aprovado;
- uma correção exigir alterar dashboard, navegação, build e PWA ao mesmo tempo;
- surgir necessidade de nova branch ou novo PR;
- a solução proposta depender de compensar outra camada;
- os testes não representarem o que o usuário vê;
- houver divergência entre branch, artefato e `gh-pages`;
- uma mudança puder comprometer o ponto de restauração.

A prioridade do projeto é previsibilidade, reversibilidade e fidelidade à experiência aprovada — não velocidade de implementação.