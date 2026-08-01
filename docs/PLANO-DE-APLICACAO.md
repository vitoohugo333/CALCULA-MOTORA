# VETTA — Plano de Aplicação, Arquitetura Modular e Evolução de Longo Prazo

> **Status:** fonte de direção do projeto  
> **Última atualização:** 1 de agosto de 2026  
> **Escopo atual:** PWA local-first, sem login obrigatório e sem backend permanente  
> **Princípio central:** evoluir com o máximo de valor e segurança antes de adicionar complexidade operacional

---

## 1. Finalidade deste documento

Este documento é a fonte principal para orientar a evolução técnica e de produto do VETTA.

Ele existe para evitar que o projeto seja guiado apenas por necessidades do momento, por alterações isoladas ou por decisões difíceis de reencontrar no futuro. Toda implementação relevante deve ser comparada com este plano antes de ser iniciada.

O documento deve ajudar a responder:

- qual problema estamos resolvendo;
- qual etapa tem prioridade;
- o que pertence ao núcleo do aplicativo;
- o que deve ser um módulo opcional;
- como testar uma função sem torná-la permanente;
- como remover uma experiência que não funcionou;
- como preservar os dados existentes;
- como evitar dependência excessiva de GitHub, Netlify ou outro fornecedor;
- quando realmente será necessário criar login, backend e sincronização;
- como manter custo, manutenção e risco proporcionais ao estágio do produto.

Este plano deve ser atualizado sempre que uma decisão estrutural importante for tomada. Mudanças de direção precisam ser registradas, e não apenas lembradas informalmente.

---

# Parte I — Direção do produto

## 2. Objetivo geral

Transformar o VETTA em um aplicativo financeiro e operacional completo para motoristas, com:

- funcionamento local-first;
- uso offline;
- instalação no Android e iPhone;
- linguagem didática;
- cálculos transparentes;
- preservação dos dados existentes;
- atualizações seguras;
- relatórios e análises úteis;
- testes automatizados;
- arquitetura modular;
- baixo custo operacional;
- independência razoável de fornecedores;
- preparação para login e sincronização no futuro, sem antecipar essa complexidade.

A primeira grande meta é alcançar uma versão local completa, útil e confiável sem obrigar o usuário a criar conta.

---

## 3. Princípios permanentes

### 3.1 Clareza antes de sofisticação

Nenhum campo deve depender de conhecimento técnico do usuário.

Palavras como:

- rendimento;
- eficiência;
- receita por quilômetro;
- custo variável;
- projeção;
- líquido estimado;
- depreciação;
- reserva;

precisam ter explicação, unidade, exemplo e contexto.

Quando uma pessoa pergunta algo que parecia óbvio para quem desenvolveu, isso deve ser tratado como evidência de melhoria da interface, não como erro do usuário.

### 3.2 Dados do usuário são um patrimônio

Nenhuma mudança pode sacrificar silenciosamente:

- registros diários;
- custos cadastrados;
- configurações;
- combustível;
- metas;
- histórico;
- eventos;
- backups anteriores compatíveis.

Toda alteração de formato deve possuir migração, validação e forma de recuperação.

### 3.3 O núcleo deve continuar simples

O aplicativo não deve depender de um grande conjunto de bibliotecas ou serviços apenas para executar cálculos, armazenar dados localmente e apresentar suas telas principais.

Complexidade deve entrar somente quando trouxer valor comprovado.

### 3.4 Módulos devem ser substituíveis

Uma funcionalidade nova deve poder ser:

- adicionada;
- ativada para teste;
- desativada;
- substituída;
- removida;

sem exigir reescrever o aplicativo inteiro.

### 3.5 Produção não é laboratório

O fluxo normal deve ser:

```text
branch de trabalho
        ↓
Pull Request
        ↓
testes automatizados
        ↓
Deploy Preview
        ↓
teste em aparelho real
        ↓
aprovação
        ↓
merge na main
        ↓
deploy de produção
```

### 3.6 Longo prazo sem superengenharia

Pensar no longo prazo não significa construir agora toda a infraestrutura que talvez seja usada futuramente.

Significa:

- criar limites claros;
- evitar acoplamento desnecessário;
- registrar decisões;
- manter dados portáveis;
- usar interfaces estáveis;
- não depender de comportamento específico de uma plataforma quando uma solução padrão é suficiente.

### 3.7 Toda função precisa justificar seu custo

Cada recurso deve ser avaliado por:

- valor para o usuário;
- frequência de uso;
- risco de erro financeiro;
- custo de manutenção;
- complexidade técnica;
- impacto no desempenho;
- impacto no armazenamento;
- possibilidade de remoção;
- necessidade real de serviço externo.

---

# Parte II — Arquitetura modular

## 4. Objetivo da modularização

A modularização deve permitir que o VETTA cresça sem se transformar em um único arquivo ou em uma rede de dependências difíceis de alterar.

A arquitetura deve suportar três tipos de elemento:

1. **Núcleo obrigatório:** funções sem as quais o produto perde sua identidade.
2. **Módulos oficiais:** capacidades estáveis que podem ser evoluídas separadamente.
3. **Experimentos:** funções temporárias, testáveis e removíveis.

O objetivo não é criar um sistema de plugins excessivamente complexo nesta fase. O objetivo é estabelecer contratos simples para que módulos não acessem qualquer parte do aplicativo de forma descontrolada.

---

## 5. Divisão conceitual

### 5.1 Núcleo da plataforma

O núcleo é responsável por:

- inicialização;
- registro dos módulos;
- navegação;
- estado global mínimo;
- acesso padronizado ao armazenamento;
- eventos internos;
- tratamento de erros;
- versionamento da aplicação;
- feature flags;
- permissões internas;
- ciclo de atualização;
- compatibilidade de dados;
- renderização do shell principal.

O núcleo não deve conhecer os detalhes de cálculo de cada módulo.

### 5.2 Domínio financeiro

Responsável por regras puras e testáveis:

- metas;
- custos;
- combustível;
- projeções;
- resultados diários;
- calendário;
- manutenção;
- relatórios;
- insights.

As funções de domínio não devem depender diretamente do DOM, de componentes visuais, de `localStorage`, do Netlify ou de APIs do navegador.

### 5.3 Infraestrutura

Responsável por:

- armazenamento;
- migrações;
- backups;
- PWA;
- exportações;
- importações;
- telemetria consentida, futuramente;
- integração com backend, futuramente.

### 5.4 Apresentação

Responsável por:

- telas;
- componentes;
- formulários;
- mensagens;
- acessibilidade;
- design tokens;
- adaptação a aparelhos;
- onboarding;
- visualização de gráficos.

A apresentação consome contratos do domínio. Ela não deve duplicar fórmulas financeiras.

### 5.5 Módulos opcionais e experimentais

Responsáveis por funções que podem existir sem alterar o núcleo:

- radar de eventos;
- manutenção avançada;
- comparação de cenários;
- gamificação;
- ranking;
- insights experimentais;
- relatório compartilhável;
- simuladores;
- novos painéis;
- integrações externas.

---

## 6. Estrutura de diretórios desejada

```text
src/
  app/
    bootstrap.js
    registry.js
    router.js
    events.js
    feature-flags.js
    error-boundary.js
    version.js

  core/
    contracts/
    types/
    validation/
    formatting/
    time/

  modules/
    dashboard/
      index.js
      manifest.js
      domain/
      application/
      views/
      tests/

    daily-records/
      index.js
      manifest.js
      domain/
      application/
      views/
      tests/

    goals/
    costs/
    fuel/
    history/
    onboarding/
    reports/
    maintenance/
    insights/
    experiments/

  storage/
    database.js
    repositories/
    migrations/
    backup/
    validation/

  pwa/
    install.js
    updates.js
    offline.js
    cache-policy.js

  ui/
    components/
    layouts/
    icons/
    feedback/
    accessibility/

  styles/
    tokens.css
    reset.css
    app.css
    components/

public/
  manifest.webmanifest
  sw.js
  icons/

tests/
  contracts/
  migrations/
  integration/
  e2e/
  fixtures/

docs/
  PLANO-DE-APLICACAO.md
  ADR/
  MODULES.md
  DATA-MODEL.md
```

Esta é uma direção arquitetural. A migração deve ser gradual e não deve forçar uma grande reescrita sem validação.

---

## 7. Contrato mínimo de um módulo

Todo módulo deve possuir um manifesto simples.

Exemplo conceitual:

```js
export const moduleManifest = {
  id: 'maintenance',
  version: '1.0.0',
  status: 'stable',
  defaultEnabled: true,
  navigation: {
    label: 'Manutenção',
    order: 50,
  },
  dataVersion: 1,
  dependencies: ['daily-records'],
};
```

O manifesto deve declarar:

- identificador estável;
- versão;
- estado do módulo;
- dependências;
- se está ativo por padrão;
- rotas ou entradas de navegação;
- versão dos dados;
- recursos necessários;
- categoria: núcleo, oficial, opcional ou experimental.

Um módulo não deve depender de caminhos internos de outro módulo. Deve consumir apenas interfaces públicas.

---

## 8. Estados possíveis de um módulo

Cada módulo pode estar em um destes estados:

### `core`

Obrigatório para a identidade do produto. Não pode ser desativado pelo usuário.

### `stable`

Oficial, testado e habilitado normalmente.

### `optional`

Oficial, mas pode ser ativado ou desativado sem quebrar o núcleo.

### `experimental`

Em validação. Pode mudar, desaparecer ou ter dados descartáveis.

### `deprecated`

Ainda compatível por um período, mas será removido.

### `removed`

Código e dados já não fazem parte do produto ativo. Migrações devem saber lidar com resíduos antigos.

---

## 9. Registro de módulos

O aplicativo deve possuir um registro central.

Responsabilidades do registro:

- validar manifestos;
- impedir IDs duplicados;
- verificar dependências;
- ordenar módulos;
- ativar somente módulos compatíveis;
- expor rotas e ações;
- isolar falhas de inicialização;
- registrar versão;
- informar quais módulos estão ativos no diagnóstico.

O registro não deve executar regras financeiras. Ele apenas organiza o ciclo de vida.

---

## 10. Comunicação entre módulos

Módulos devem se comunicar por duas formas principais.

### 10.1 Serviços públicos

Exemplos:

- `recordsRepository.list()`;
- `goalsService.calculate()`;
- `costsService.monthlyTotal()`;
- `reportsService.buildMonthlyReport()`.

Esses serviços devem ter contratos testados.

### 10.2 Eventos internos

Exemplos:

- `record:created`;
- `record:updated`;
- `cost:changed`;
- `goal:recalculated`;
- `backup:imported`;
- `app:updated`.

Eventos evitam que um módulo chame diretamente detalhes internos de outro.

Regras:

- eventos devem ter nomes estáveis;
- payloads devem ser validados;
- eventos não podem ser a única fonte de verdade;
- falha de um observador não pode impedir o evento principal;
- eventos críticos precisam de testes de integração.

---

## 11. Feature flags

Feature flags permitirão testar recursos sem torná-los permanentes.

Exemplos:

```js
export const featureFlags = {
  newOnboarding: false,
  maintenanceModule: false,
  experimentalInsights: false,
};
```

Nesta fase, flags podem ser locais e versionadas no código.

Futuramente, se houver backend, algumas flags poderão ser remotas. O aplicativo não deve depender de flags remotas para abrir ou preservar dados.

### Regras para feature flags

- toda flag deve ter responsável e objetivo;
- toda flag deve ter data ou condição de revisão;
- flags não podem permanecer indefinidamente;
- quando a decisão for tomada, a flag e o caminho descartado devem ser removidos;
- dados criados por um experimento devem possuir estratégia de migração ou descarte;
- recursos financeiros experimentais não devem alterar registros oficiais sem confirmação explícita.

---

## 12. Laboratório de experimentos

Funções novas que ainda não provaram valor devem entrar em um espaço controlado.

Exemplos:

- nova forma de apresentar meta;
- painel alternativo;
- novo modelo de insight;
- gamificação;
- previsão experimental;
- comparação de horários;
- recomendação de jornada;
- novo gráfico.

### Processo de experimento

1. Registrar hipótese.
2. Definir qual problema será resolvido.
3. Definir como saber se funcionou.
4. Construir como módulo experimental ou flag.
5. Usar dados isolados quando necessário.
6. Criar testes de segurança e regressão.
7. Gerar Deploy Preview.
8. Testar com pessoas reais.
9. Registrar resultados.
10. Promover, modificar ou remover.

### Resultados possíveis

- **Promovido:** vira módulo estável.
- **Revisado:** continua experimental com mudança clara.
- **Descartado:** código, flag e dados temporários são removidos.

Um experimento descartado não deve deixar código morto ou caminhos permanentes na aplicação.

---

## 13. Isolamento de dados experimentais

Experimentos não devem escrever diretamente em estruturas oficiais sem necessidade.

Opções:

- namespace separado no armazenamento;
- campo de versão próprio;
- dados derivados, recalculáveis;
- armazenamento em memória;
- snapshot antes de alteração;
- confirmação explícita antes de incorporar ao estado principal.

Exemplo de namespaces:

```text
vetta/core/records
vetta/core/settings
vetta/modules/maintenance
vetta/experiments/new-dashboard
```

A implementação real pode usar IndexedDB com stores separadas, mas o princípio deve existir desde antes da migração.

---

## 14. Critérios para um módulo entrar no produto

Um módulo só deve virar estável quando:

- resolve um problema claro;
- possui contrato definido;
- não duplica regras existentes;
- possui testes unitários;
- possui teste de integração quando necessário;
- possui estados vazios e de erro;
- não quebra funcionamento offline sem justificativa;
- possui migração de dados;
- possui documentação mínima;
- foi testado em aparelho real;
- foi compreendido por usuários de teste;
- tem plano de manutenção;
- pode ser removido ou desativado de forma previsível.

---

## 15. Critérios para remover um módulo

Um módulo pode ser removido quando:

- não entrega valor suficiente;
- quase não é utilizado;
- aumenta confusão;
- duplica outro recurso;
- cria risco financeiro;
- exige manutenção desproporcional;
- depende de serviço caro sem retorno;
- falha em testes com usuários.

A remoção deve considerar:

- exportação de dados;
- migração para recurso substituto;
- limpeza segura;
- compatibilidade com backups antigos;
- mensagem ao usuário quando necessário;
- remoção de rotas, flags, estilos, testes e eventos.

---

## 16. Núcleo mínimo recomendado

Os seguintes módulos devem formar o núcleo funcional inicial:

- shell e navegação;
- onboarding;
- configurações operacionais;
- combustível;
- custos;
- metas;
- registro diário;
- histórico;
- cálculo financeiro;
- backup;
- PWA e atualização;
- diagnóstico e versão.

Os seguintes podem começar como módulos opcionais:

- manutenção;
- relatórios avançados;
- insights;
- ranking;
- comparação de cenários;
- radar e eventos;
- compartilhamento visual;
- gamificação.

---

# Parte III — Portabilidade e independência tecnológica

## 17. Não depender do GitHub como parte do produto

GitHub deve ser ferramenta de desenvolvimento, não dependência de execução.

O aplicativo publicado não deve precisar acessar GitHub para:

- iniciar;
- validar versão;
- calcular;
- salvar dados;
- funcionar offline;
- carregar módulos oficiais.

O repositório deve poder ser migrado para outro provedor Git sem alterar o produto.

### Medidas

- usar Git padrão;
- evitar workflows que só funcionem com lógica exclusiva desnecessária;
- manter scripts executáveis localmente;
- documentar variáveis e comandos;
- não armazenar decisões somente em issues;
- manter documentação crítica no próprio repositório.

---

## 18. Não depender do Netlify como parte do domínio

Netlify deve hospedar e entregar o site, mas não definir as regras do produto.

O aplicativo deve poder ser hospedado futuramente em:

- Cloudflare Pages;
- Vercel;
- GitHub Pages, quando compatível;
- servidor estático próprio;
- armazenamento de objetos com CDN;
- outro provedor.

### Regras

- build deve gerar uma pasta estática padrão, preferencialmente `dist`;
- redirects e headers devem ter documentação equivalente;
- nenhuma fórmula deve depender de Function ou Edge Function;
- variáveis específicas da hospedagem devem ficar em adaptadores;
- o service worker deve funcionar independentemente do provedor;
- o projeto deve poder rodar com `npm install`, `npm run build` e um servidor estático.

---

## 19. Padrões tecnológicos

Preferências atuais:

- JavaScript moderno com módulos ES;
- Vite para desenvolvimento e build;
- HTML e CSS acessíveis;
- Node.js LTS ou versão estável definida no projeto;
- testes nativos do Node quando suficientes;
- Playwright para fluxos reais;
- IndexedDB para armazenamento estruturado;
- JSON, CSV e PDF para portabilidade;
- APIs Web padrão antes de dependências externas.

Bibliotecas devem ser adotadas quando reduzirem risco ou esforço de forma mensurável.

---

## 20. Decisões arquiteturais registradas

Decisões importantes devem virar ADRs em `docs/ADR/`.

Formato sugerido:

```text
ADR-0001-usar-vite.md
ADR-0002-local-first.md
ADR-0003-registro-de-modulos.md
ADR-0004-indexeddb.md
ADR-0005-backend-futuro.md
```

Cada ADR deve registrar:

- contexto;
- decisão;
- alternativas consideradas;
- consequências;
- riscos;
- condição para revisar a decisão.

---

# Parte IV — Clareza e experiência do usuário

## 21. Revisão completa da linguagem

### Caso “rendimento”

“Rendimento” não é suficientemente claro para todos.

Também não devemos chamar diretamente de “consumo por km” quando o valor informado é `km/L` ou `km/m³`, pois são medidas inversas.

### Campo recomendado para combustível líquido

**Quantos quilômetros o veículo faz com 1 litro?**

Unidade:

```text
km/L
```

Texto auxiliar:

```text
Exemplo: se o carro percorre aproximadamente 10 km usando 1 litro, informe 10.
```

### Campo recomendado para GNV

**Quantos quilômetros o veículo faz com 1 m³ de GNV?**

Unidade:

```text
km/m³
```

### Resultado calculado

**Custo de combustível por quilômetro**

```text
R$ 0,48 por km
```

Texto auxiliar:

```text
É quanto você gasta de combustível para percorrer 1 km.
```

A interface deve deixar clara a diferença:

```text
Entrada: quantos quilômetros o veículo faz por litro ou m³
Resultado: quanto custa percorrer cada quilômetro
```

---

## 22. Dicionário de linguagem sugerido

| Termo técnico | Texto recomendado |
|---|---|
| Rendimento | Quantos km faz com 1 litro ou 1 m³ |
| Eficiência | Consumo do veículo |
| Receita por km | Quanto você recebe por km rodado |
| Custo por km | Quanto cada km custa |
| Meta líquida | Quanto você quer que sobre no mês |
| Faturamento bruto | Total recebido antes dos custos |
| Líquido | Valor que sobra depois dos custos |
| Custos fixos | Contas que existem mesmo sem trabalhar |
| Custos variáveis | Gastos que aumentam conforme você roda |
| Projeção | Estimativa para o fim do período |
| Reserva | Dinheiro separado para gastos futuros |
| Depreciação | Perda estimada de valor do veículo com uso e tempo |

Cada campo importante deve ter:

- título claro;
- unidade visível;
- exemplo;
- explicação curta;
- validação humana;
- indicação quando um número é estimado.

---

## 23. Onboarding guiado

### Etapa 1 — apresentação

Explicar:

- para que serve o VETTA;
- que os dados ficam no aparelho;
- que não é necessário criar conta;
- que tudo poderá ser alterado depois.

### Etapa 2 — rotina de trabalho

Perguntar:

- dias da semana;
- folgas extras;
- média opcional de horas por dia.

Mostrar imediatamente quantos dias de trabalho serão considerados.

### Etapa 3 — combustível

Perguntar:

- tipo;
- preço;
- quantos quilômetros faz por litro ou m³.

Mostrar o custo calculado por quilômetro.

### Etapa 4 — receita operacional

Perguntar:

**Em média, quanto você recebe por quilômetro rodado?**

Explicar com exemplo:

```text
R$ 240 de faturamento ÷ 120 km = R$ 2,00 por km.
```

Permitir “Ainda não sei”.

### Etapa 5 — custos

Oferecer categorias editáveis:

- financiamento ou aluguel;
- seguro;
- telefone e internet;
- lavagem;
- manutenção;
- pneus;
- documentação;
- alimentação;
- reservas;
- outros.

### Etapa 6 — objetivo

Perguntar:

**Quanto você quer que sobre no mês depois de pagar os custos?**

### Etapa 7 — primeira meta

Mostrar:

- faturamento mensal necessário;
- faturamento diário;
- quilometragem estimada;
- custo de combustível;
- líquido esperado;
- dias considerados;
- explicação “Como chegamos a esse número?”.

### Etapa 8 — primeira ação

Levar para “Registrar meu primeiro dia”.

### Requisitos

- voltar;
- pular opcionais;
- salvar progresso;
- refazer sem apagar registros;
- não bloquear o aplicativo;
- funcionar offline.

---

# Parte V — Funcionalidades do produto local

## 24. Dashboard didático

Deve apresentar em primeiro lugar:

- meta de faturamento do dia;
- líquido esperado;
- situação do mês;
- quanto falta;
- dias restantes;
- média necessária daqui para frente.

Todo cartão deve responder:

- o que é;
- como foi calculado;
- qual período utiliza;
- se é estimativa ou valor registrado.

Estados vazios devem orientar uma ação, em vez de apenas mostrar zero.

---

## 25. Fechamento diário

### Dados essenciais

- data;
- faturamento;
- quilômetros.

### Dados opcionais

- horas online;
- combustível abastecido;
- quantidade;
- preço;
- pedágio;
- estacionamento;
- alimentação;
- lavagem;
- outros gastos;
- observações.

### Resultados automáticos

- faturamento por km;
- faturamento por hora;
- custo de combustível;
- custos variáveis;
- parcela dos custos fixos;
- líquido estimado;
- diferença para a meta;
- comparação com a própria média.

---

## 26. Histórico e gráficos

Filtros:

- semana;
- mês;
- período personalizado;
- dia da semana;
- combustível.

Gráficos possíveis:

- faturamento;
- líquido;
- custo por km;
- receita por km;
- quilômetros;
- horas;
- líquido por hora;
- progresso;
- distribuição de custos.

Os números principais devem existir fora do gráfico, e cores não podem ser o único indicador.

---

## 27. Custos e manutenção

### Custos fixos

- financiamento;
- aluguel;
- seguro;
- documentação;
- internet;
- assinaturas;
- estacionamento mensal.

### Custos variáveis

- combustível;
- manutenção por km;
- pneus por km;
- lavagem;
- pedágio;
- alimentação;
- comissão;
- outros.

### Manutenção preventiva

Itens por data, quilometragem ou ambos:

- óleo;
- filtros;
- pneus;
- freios;
- alinhamento;
- correias;
- revisão;
- outros.

O módulo de manutenção deve começar como opcional e só virar parte estável após validação.

---

## 28. Projeções e inteligência local

Insights possíveis:

- melhor dia da semana;
- pior dia;
- tendência de custo por km;
- aumento de consumo;
- queda de receita por km;
- distância necessária para a meta;
- média necessária nos dias restantes;
- impacto de uma folga;
- impacto de um novo custo;
- impacto da troca de combustível.

Regras:

- explicar a base;
- exigir dados mínimos;
- não afirmar causalidade indevida;
- usar linguagem de estimativa;
- não recomendar jornadas perigosas;
- permitir dispensar o insight.

O módulo de insights deve ser desacoplado. A aplicação deve continuar plenamente funcional sem ele.

---

## 29. Relatórios e compartilhamento

Relatório mensal:

- faturamento;
- custos;
- líquido;
- quilômetros;
- horas;
- média diária;
- receita por km;
- custo por km;
- líquido por km;
- líquido por hora;
- progresso da meta;
- comparação com período anterior.

Exportações:

- JSON completo;
- CSV;
- PDF;
- imagem resumida.

Antes de compartilhar, permitir ocultar informações sensíveis.

---

# Parte VI — Dados e armazenamento

## 30. Evolução para IndexedDB

A migração de `localStorage` para IndexedDB deve ser gradual.

Benefícios:

- maior capacidade;
- stores separadas;
- consultas estruturadas;
- transações;
- melhor suporte a módulos;
- snapshots;
- recuperação mais segura.

Stores conceituais:

```text
app_meta
settings
records
costs
maintenance
modules
feature_flags
experiments
snapshots
```

---

## 31. Camada de repositórios

Módulos não devem acessar IndexedDB diretamente.

Devem consumir repositórios como:

```js
recordsRepository.create(record)
recordsRepository.listByPeriod(period)
costsRepository.save(cost)
settingsRepository.get()
```

Isso permitirá:

- trocar implementação de armazenamento;
- criar testes em memória;
- futuramente sincronizar com servidor;
- exportar dados;
- aplicar validação central.

---

## 32. Migrações

Toda mudança de esquema deve ter:

- número de versão;
- transformação determinística;
- validação antes e depois;
- snapshot anterior;
- teste com fixtures antigas;
- recuperação em caso de falha;
- compatibilidade de importação.

Migrações nunca devem depender da interface estar aberta em determinada tela.

---

## 33. Backup

Oferecer:

- exportação completa;
- data e versão;
- validação de integridade;
- visualização antes de importar;
- possibilidade de substituição ou mesclagem quando segura;
- aviso contra operação destrutiva;
- compatibilidade com versões anteriores.

O formato de backup deve ser documentado e independente de provedor.

---

# Parte VII — PWA e funcionamento offline

## 34. Instalação

### Android

- usar `beforeinstallprompt` quando disponível;
- exibir botão apenas quando fizer sentido;
- detectar app instalado;
- fornecer instrução alternativa.

### iPhone

- detectar iOS;
- orientar pelo Safari;
- explicar Compartilhar → Adicionar à Tela de Início;
- não mostrar botão que pareça quebrado;
- respeitar áreas seguras.

---

## 35. Atualizações

- verificar nova versão;
- informar atualização;
- preservar dados;
- evitar loop de recarga;
- exibir versão instalada;
- permitir diagnóstico;
- manter política clara de cache.

O service worker deve ser infraestrutura e não deve conter regras de negócio.

---

## 36. Offline

O usuário deve poder:

- abrir o app;
- registrar dias;
- consultar histórico;
- alterar configurações;
- calcular metas;
- exportar backup;
- utilizar módulos locais compatíveis.

Módulos que dependam de rede devem declarar essa dependência e possuir estado offline adequado.

---

# Parte VIII — Acessibilidade e qualidade

## 37. Acessibilidade

- contraste adequado;
- alvos de toque grandes;
- labels reais;
- foco visível;
- suporte a teclado;
- mensagens associadas aos campos;
- leitores de tela;
- redução de movimento;
- fontes ajustáveis;
- texto fora dos gráficos;
- unidades sempre visíveis.

---

## 38. Design system mínimo

Criar tokens para:

- cores;
- espaços;
- tipografia;
- raios;
- sombras;
- estados;
- tamanhos de toque;
- z-index;
- animações.

Componentes comuns:

- botão;
- campo;
- seletor;
- card;
- modal;
- toast;
- tooltip didático;
- indicador;
- estado vazio;
- confirmação;
- gráfico acessível.

Módulos devem reutilizar esses componentes em vez de criar versões incompatíveis.

---

# Parte IX — Testes e qualidade de engenharia

## 39. Pirâmide de testes

### Testes unitários

Para:

- fórmulas;
- calendário;
- normalização;
- validação;
- migrações;
- contratos dos módulos.

### Testes de integração

Para:

- módulos e repositórios;
- eventos;
- importação e migração;
- registro e recálculo;
- feature flags.

### Testes E2E

Para:

1. onboarding;
2. preservação de dados após atualização;
3. custos alterando metas;
4. registro alterando dashboard;
5. backup e importação;
6. funcionamento offline;
7. atualização sem loop;
8. instrução correta de instalação;
9. aplicativo aberto sem senha;
10. módulo experimental ativado e desativado sem quebrar o núcleo.

---

## 40. Testes por módulo

Cada módulo deve possuir:

- teste do manifesto;
- teste de contrato;
- teste das regras;
- teste de estado vazio;
- teste de falha;
- teste de ativação/desativação;
- teste de dados antigos quando aplicável.

O pipeline deve conseguir executar os testes de um módulo isoladamente.

---

## 41. GitHub Actions

Executar em Pull Requests:

- instalação limpa;
- testes unitários;
- testes de contrato;
- testes de migração;
- build;
- inspeção de `dist`;
- verificação do manifesto PWA;
- Playwright crítico;
- busca por segredos;
- validação de módulos;
- verificação de dependências circulares quando possível.

Scripts devem funcionar localmente e não somente no GitHub Actions.

---

## 42. Deploy Preview

Toda mudança de interface, módulo ou fluxo deve gerar preview.

Checklist:

- Android;
- iPhone quando aplicável;
- tela pequena;
- offline;
- dados existentes;
- dados vazios;
- atualização;
- acessibilidade básica;
- módulo ligado e desligado.

---

# Parte X — Testes com usuários

## 43. Roteiro mínimo

Pedir para uma pessoa:

1. entender a proposta;
2. concluir onboarding;
3. configurar combustível;
4. cadastrar custo;
5. encontrar a meta;
6. registrar um dia;
7. interpretar o resultado;
8. consultar histórico;
9. exportar backup;
10. instalar o PWA.

Não explicar durante o teste, salvo bloqueio completo.

Registrar:

- termos que causaram dúvida;
- campos incorretos;
- botões não encontrados;
- números não compreendidos;
- expectativas diferentes;
- partes consideradas úteis ou desnecessárias.

---

## 44. Validação de módulos experimentais

Cada experimento deve possuir perguntas específicas:

- a pessoa encontrou o recurso?
- entendeu para que serve?
- usaria novamente?
- mudou uma decisão?
- adicionou confusão?
- tornou o fluxo mais lento?
- pareceu confiável?

A opinião de quem desenvolveu não deve ser a única evidência para manter uma função.

---

# Parte XI — Etapas de aplicação

## 45. Etapa 0 — estabilização da infraestrutura

- consolidar Netlify;
- remover resíduos de senha;
- remover extensões desnecessárias;
- garantir build estático;
- identificar commit e versão;
- validar atualização;
- impedir publicação de legado.

### Conclusão

Mesmo commit identificável no GitHub, no deploy e no aplicativo.

---

## 46. Etapa 1 — fundação modular

- criar bootstrap;
- criar registro de módulos;
- definir manifesto;
- criar event bus simples;
- criar feature flags;
- definir contratos de armazenamento;
- documentar limites entre núcleo e módulos;
- criar teste de ativação e desativação.

### Conclusão

Um módulo de demonstração deve poder ser registrado, exibido, desativado e removido sem mudar o núcleo.

---

## 47. Etapa 2 — linguagem didática

- substituir “rendimento”;
- revisar termos;
- incluir unidades;
- incluir exemplos;
- melhorar erros;
- diferenciar estimativa de registro.

### Conclusão

Pessoa nova configura combustível sem ajuda.

---

## 48. Etapa 3 — onboarding

- construir fluxo;
- salvar progresso;
- permitir voltar;
- permitir pular;
- permitir refazer;
- calcular primeira meta;
- testar com pessoa nova.

---

## 49. Etapa 4 — consolidação Vite

- migrar domínio;
- migrar armazenamento;
- migrar telas;
- obter paridade funcional;
- preservar dados;
- eliminar patches e `.part`;
- gerar `dist` estático.

A migração deve ocorrer por módulos, não por reescrita total sem pontos de controle.

---

## 50. Etapa 5 — fechamento diário

- melhorar formulário;
- incluir opcionais;
- gerar feedback;
- recalcular módulos dependentes por evento.

---

## 51. Etapa 6 — histórico e gráficos

- filtros;
- indicadores;
- comparações;
- acessibilidade;
- gráficos como módulo substituível.

---

## 52. Etapa 7 — custos e manutenção

- ampliar categorias;
- criar manutenção como módulo opcional;
- simular impacto;
- validar valor com usuários.

---

## 53. Etapa 8 — relatórios e backup

- JSON;
- CSV;
- PDF;
- importação segura;
- relatório mensal modular.

---

## 54. Etapa 9 — IndexedDB

- repositórios;
- stores;
- migração;
- snapshots;
- testes de volume;
- compatibilidade de backups.

---

## 55. Etapa 10 — inteligência local

- módulo de insights;
- regras explicáveis;
- limites mínimos de dados;
- feature flag inicial;
- possibilidade de remoção completa.

---

## 56. Etapa 11 — acabamento

- acessibilidade;
- modo escuro;
- iPhone;
- desempenho;
- revisão visual;
- diagnóstico;
- testes completos.

---

# Parte XII — Operação eficiente

## 57. Uso do Netlify

- testar em Deploy Preview;
- usar produção apenas após aprovação;
- evitar vários commits de tentativa na `main`;
- manter hospedagem estática;
- não ativar Functions ou banco sem necessidade;
- revisar extensões instaladas;
- documentar configuração de hospedagem.

---

## 58. Uso do GitHub

- branches por mudança;
- PRs com objetivo claro;
- commits coerentes;
- testes automáticos;
- documentação no repositório;
- proteção da `main` quando o fluxo estiver estável;
- evitar workflows redundantes.

---

# Parte XIII — Quando entrar em login e backend

## 59. Sinais reais de necessidade

Login e backend só devem entrar quando houver necessidade comprovada de:

- usar dados em vários aparelhos;
- recuperar dados após perda;
- compartilhar conta;
- administrar usuários;
- cobrar assinatura;
- sincronizar automaticamente;
- enviar notificações remotas;
- acessar painel remoto;
- manter dados centralizados.

Perguntas obrigatórias:

- usuários pediram sincronização?
- quantos usam mais de um aparelho?
- backup manual é insuficiente?
- há necessidade de recuperação de conta?
- existe modelo de receita?
- quais dados precisam do servidor?
- qual custo de suporte e segurança?
- como será exclusão e exportação?

---

## 60. Preparação sem construir backend agora

Mesmo sem backend, preparar:

- IDs estáveis;
- timestamps;
- repositórios;
- separação entre domínio e armazenamento;
- formato de backup versionado;
- conflitos documentados;
- módulos sem dependência de localStorage direto.

Isso reduz o custo de sincronização futura sem introduzir servidor prematuramente.

---

# Parte XIV — Governança do projeto

## 61. Definição de pronto

Uma entrega só está pronta quando:

- atende ao objetivo;
- possui testes proporcionais;
- preserva dados;
- funciona no preview;
- foi verificada em aparelho real quando necessário;
- não adiciona segredo;
- não cria dependência oculta;
- atualiza documentação relevante;
- possui caminho de reversão;
- não deixa código morto.

---

## 62. Revisão periódica

A cada ciclo relevante, revisar:

- módulos ativos;
- experimentos abertos;
- flags antigas;
- dependências;
- custos de hospedagem;
- erros de usuários;
- desempenho;
- documentação;
- riscos de dados;
- recursos sem uso.

---

## 63. Backlog por categorias

O backlog deve separar:

- estabilidade;
- clareza;
- núcleo;
- módulos oficiais;
- experimentos;
- dívida técnica;
- acessibilidade;
- dados;
- infraestrutura;
- pesquisa com usuários.

Uma ideia experimental não deve entrar diretamente no backlog do núcleo.

---

## 64. Registro de experimentos

Criar futuramente `docs/EXPERIMENTS.md` com:

- nome;
- hipótese;
- módulo;
- flag;
- responsável;
- início;
- critérios;
- resultado;
- decisão;
- data de remoção ou promoção.

---

# Parte XV — Prioridade imediata

## 65. Próxima sequência recomendada

### Ciclo A — infraestrutura e documentação

1. validar o deploy público;
2. remover extensão não utilizada;
3. consolidar Vite e `dist`;
4. identificar versão;
5. criar os primeiros ADRs;
6. criar documento de módulos.

### Ciclo B — fundação modular mínima

1. criar registro de módulos;
2. definir manifesto;
3. criar feature flags locais;
4. criar eventos internos;
5. extrair serviços de domínio;
6. criar teste de módulo removível.

### Ciclo C — clareza

1. trocar “Rendimento”;
2. mostrar `km/L` ou `km/m³`;
3. exibir custo por km;
4. revisar termos ambíguos;
5. adicionar textos auxiliares;
6. testar com pessoa nova.

### Ciclo D — onboarding

1. criar módulo de onboarding;
2. salvar progresso;
3. calcular primeira meta;
4. permitir refazer;
5. testar entendimento.

### Ciclo E — migração funcional

1. migrar cada domínio;
2. preservar compatibilidade;
3. obter paridade;
4. remover legado apenas depois dos testes.

---

# Parte XVI — Critérios da versão local completa

## 66. O VETTA local estará maduro quando

- uma pessoa nova concluir o fluxo sem ajuda;
- os termos financeiros forem compreensíveis;
- o aplicativo funcionar offline;
- Android e iPhone tiverem orientação adequada;
- dados sobreviverem a atualizações;
- backups forem confiáveis;
- relatórios forem úteis;
- módulos puderem ser ligados e desligados;
- experimentos puderem ser removidos sem resíduos;
- testes impedirem regressões;
- o produto suportar uso contínuo;
- usuários reais confirmarem valor;
- limitações sem sincronização estiverem claras;
- hospedagem puder ser trocada sem reescrever o domínio.

---

# Parte XVII — Regra final de decisão

Antes de implementar qualquer ideia, responder:

1. Qual problema real ela resolve?
2. Ela pertence ao núcleo, a um módulo oficial ou a um experimento?
3. Pode ser ativada e removida com segurança?
4. Quais dados cria ou altera?
5. Como será testada?
6. Como saberemos se funcionou?
7. Qual o custo de manutenção?
8. Depende de serviço externo?
9. Existe alternativa mais simples?
10. O projeto continuará compreensível depois dessa mudança?

O objetivo do VETTA não é possuir o maior número possível de funções. É possuir funções úteis, confiáveis, compreensíveis e evolutivas, sustentadas por uma base modular que permita aprender sem transformar cada teste em uma obrigação permanente.
