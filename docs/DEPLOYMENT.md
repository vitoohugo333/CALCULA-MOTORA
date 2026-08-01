# VETTA — Ambientes e fluxo de publicação

## Regra atual

Enquanto o produto estiver em implementação ativa:

- **GitHub Pages** é o ambiente compartilhado de desenvolvimento e testes visuais;
- **GitHub Actions** executa validações automatizadas;
- **Netlify** é reservado para produção na branch `main`;
- Deploy Preview e branch deploy no Netlify devem permanecer desativados ou ignorados;
- Netlify só pode ser usado fora da produção quando houver necessidade técnica explícita que o GitHub Pages não consiga atender.

## Fluxo de desenvolvimento

```text
feature/* ou refactor/*
        ↓
GitHub Actions
        ↓
GitHub Pages
        ↓
teste em aparelhos reais
        ↓
Pull Request
        ↓
revisão e aprovação
        ↓
merge na main
        ↓
Netlify produção
```

## GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` publica o candidato mais recente enviado para:

- `feature/**`;
- `refactor/**`;
- `develop`.

O GitHub Pages é um único ambiente. Portanto, a última branch de desenvolvimento publicada substitui visualmente a anterior. Ele não deve ser tratado como produção nem como histórico permanente de previews.

O ambiente contém `robots.txt` com bloqueio de indexação e não deve armazenar segredos ou dados reais de usuários.

## Netlify

O `netlify.toml` usa um comando `ignore` para continuar o build apenas quando `CONTEXT=production`.

Consequências:

- push ou merge na `main`: build de produção permitido;
- Pull Request: build ignorado;
- branch deploy: build ignorado;
- ambiente de desenvolvimento: build ignorado.

A configuração no painel do Netlify também deve manter Deploy Previews desativados quando possível.

## Exceções

O Netlify pode ser usado temporariamente fora da produção quando a mudança depender especificamente de:

- Functions;
- Edge Functions;
- redirects ou headers exclusivos do Netlify;
- variáveis de ambiente do servidor;
- webhooks;
- comportamento de CDN que não possa ser reproduzido no GitHub Pages.

A exceção deve ser registrada no Pull Request, limitada no tempo e removida quando o teste terminar.

## Critérios antes da produção

Antes do merge na `main`:

- checks automatizados verdes;
- GitHub Pages funcional;
- teste manual em aparelho real quando a mudança afetar interface ou PWA;
- nenhuma credencial no repositório;
- migrações de dados testadas quando aplicável;
- plano de rollback para alterações de alto risco.
