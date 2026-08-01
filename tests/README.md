# Verificação de produção

A correção 3.5.1 só pode ser integrada quando:

- o bundle contém um único `app.init()`;
- nenhuma requisição para `parts/` ocorre no navegador;
- o modal fecha pelo ícone interno do botão;
- uma nova despesa é salva uma única vez no armazenamento local;
- o Chromium não registra erro de página;
- o service worker usa o cache `vetta-v3.5.1`.
