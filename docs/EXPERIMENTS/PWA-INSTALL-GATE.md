# Experimento — instalação obrigatória do PWA

## Status

Em validação no GitHub Pages. Não ativado no Netlify de produção.

A experiência de instalação foi consolidada para parecer uma etapa natural do VETTA. A interface não apresenta ao motorista termos como PWA, funcionamento offline, aba ou detalhes do navegador.

## Hipótese

Exigir que o usuário abra o VETTA pelo ícone instalado pode:

- deixar o acesso mais direto e consistente;
- reduzir a confusão entre o endereço recebido e o aplicativo pronto para uso;
- preparar a experiência para recursos vinculados ao aparelho;
- reforçar a percepção de valor do VETTA como aplicativo.

## Experiência aprovada

### iPhone

A tela comunica explicitamente que “Adicionar à Tela de Início” instala o VETTA e que ele funcionará como qualquer aplicativo.

Texto principal aprovado:

- título: `Instale o VETTA no seu iPhone`;
- explicação: a instalação é feita pela opção `Adicionar à Tela de Início`;
- resultado: o VETTA cria um ícone próprio e funciona normalmente, como qualquer aplicativo;
- benefícios: instala o aplicativo, cria ícone próprio e é feito uma única vez;
- passos: Compartilhar → Adicionar à Tela de Início → Adicionar → abrir pelo novo ícone;
- aviso final: fechar a tela atual e abrir o VETTA pelo ícone criado.

No Safari, não existe botão artificial de copiar link ou confirmar instalação. Em outro navegador do iPhone, aparece somente o fallback necessário para copiar o endereço e abrir no Safari.

### Android e desktop

- quando o instalador do sistema está disponível, o botão principal é `Instalar VETTA`;
- quando não está disponível, a própria tela mostra os passos pelo menu;
- a linguagem permanece curta e apresenta o resultado como aplicativo instalado;
- não existe botão `Já instalei`; a liberação acontece ao abrir pelo ícone.

## Comportamento técnico testado

- Em uma página comum, o conteúdo fica bloqueado.
- Em modo `standalone`, o aplicativo é liberado automaticamente.
- Android e desktop usam `beforeinstallprompt` quando disponível.
- iPhone recebe tutorial específico para `Adicionar à Tela de Início`.
- Depois de instalar, a página comum continua bloqueada e orienta a abrir pelo ícone.
- Não existe botão de fechar ou pular durante o experimento.

## Limites técnicos

- `beforeinstallprompt` não é um padrão universal e é principalmente suportado por navegadores Chromium.
- No iPhone, a página não pode abrir programaticamente o instalador; o usuário precisa usar o menu Compartilhar.
- A página atual não se transforma em uma janela standalone após a instalação. A liberação acontece ao abrir o ícone instalado.
- O gate é uma regra de experiência, não um mecanismo de segurança.

## Critérios de sucesso

- Usuários entendem como instalar sem ajuda verbal.
- O motorista percebe que está instalando o VETTA, não apenas salvando um endereço.
- O botão nativo aparece em Android compatível.
- O tutorial funciona no Safari do iPhone.
- O aplicativo abre sem o gate depois de instalado.
- Não há perda de dados nem regressão nos fluxos atuais.
- A taxa de abandono causada pelo bloqueio é aceitável.

## Critérios de remoção ou revisão

O bloqueio deve ser removido ou suavizado se:

- muitos usuários não conseguem instalar;
- aparelhos relevantes não oferecem um caminho claro;
- o fluxo impede acesso emergencial aos próprios dados;
- a taxa de abandono supera o benefício;
- o suporte necessário se torna desproporcional.

## Estratégia de promoção

1. Validar no GitHub Pages em Android e iPhone reais.
2. Registrar dúvidas e pontos de abandono.
3. Ajustar somente problemas comprovados nos testes físicos.
4. Decidir entre bloqueio obrigatório, período de tolerância ou instalação recomendada.
5. Somente depois integrar o gate ao build oficial de produção.

## Rollback

O experimento é injetado apenas pelo script `scripts/prepare-pages.mjs`. Para removê-lo do ambiente de desenvolvimento, basta retirar a injeção de `pwa-install-gate.js` e `pwa-install-gate.css`; o `index.html` oficial permanece intacto.
