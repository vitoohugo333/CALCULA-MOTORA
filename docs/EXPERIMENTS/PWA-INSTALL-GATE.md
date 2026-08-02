# Experimento — instalação obrigatória do PWA

## Status

Em validação no GitHub Pages. Não ativado no Netlify de produção.

## Hipótese

Exigir que o usuário abra o VETTA como PWA instalado pode:

- reduzir confusão entre aba e aplicativo;
- melhorar a descoberta do uso offline;
- criar uma experiência mais consistente;
- facilitar futuras notificações e recursos vinculados ao dispositivo.

## Comportamento testado

- Em aba comum, o conteúdo fica bloqueado.
- Em modo `standalone`, o aplicativo é liberado automaticamente.
- Android e desktop usam `beforeinstallprompt` quando disponível.
- iPhone recebe tutorial específico para “Adicionar à Tela de Início”.
- Depois de instalar, a aba comum continua bloqueada e orienta a abrir pelo ícone.
- Não existe botão de fechar ou pular durante o experimento.

## Limites técnicos

- `beforeinstallprompt` não é um padrão universal e é principalmente suportado por navegadores Chromium.
- No iPhone, a página não pode abrir programaticamente o instalador; o usuário precisa usar o menu Compartilhar.
- O navegador não consegue transformar a aba atual em uma janela standalone após a instalação. A liberação acontece ao abrir o ícone instalado.
- O gate é uma regra de experiência, não um mecanismo de segurança. Usuários com conhecimento técnico podem alterar o código local do navegador.

## Critérios de sucesso

- Usuários entendem como instalar sem ajuda verbal.
- O botão nativo aparece em Android compatível.
- O tutorial funciona no Safari do iPhone.
- O PWA abre sem o gate depois de instalado.
- Não há perda de dados nem regressão nos fluxos atuais.
- A taxa de abandono causada pelo bloqueio é aceitável.

## Critérios de remoção ou revisão

O bloqueio deve ser removido ou suavizado se:

- muitos usuários não conseguem instalar;
- navegadores relevantes não oferecem um caminho claro;
- o fluxo impede acesso emergencial aos próprios dados;
- a taxa de abandono supera o benefício;
- o suporte necessário se torna desproporcional.

## Estratégia de promoção

1. Validar no GitHub Pages em Android e iPhone reais.
2. Registrar dúvidas e pontos de abandono.
3. Ajustar textos e instruções.
4. Decidir entre bloqueio obrigatório, período de tolerância ou instalação recomendada.
5. Somente depois integrar o gate ao build oficial de produção.

## Rollback

O experimento é injetado apenas pelo script `scripts/prepare-pages.mjs`. Para removê-lo do ambiente de desenvolvimento, basta retirar a injeção de `pwa-install-gate.js` e `pwa-install-gate.css`; o `index.html` oficial permanece intacto.
