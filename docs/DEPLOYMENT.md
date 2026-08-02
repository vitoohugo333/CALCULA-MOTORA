# VETTA — Ambientes e fluxo de publicação

## Regra atual

Enquanto o produto estiver em implementação ativa:

- **GitHub Pages** é o ambiente compartilhado de desenvolvimento e testes visuais;
- **GitHub Actions** executa validações automatizadas;
- **Netlify** é reservado para produção na branch `main`;
- Deploy Preview e branch deploy no Netlify devem permanecer desativados ou ignorados;
- Netlify só pode ser usado fora da produção quando houver necessidade técnica explícita que o GitHub Pages não consiga atender.

## Fluxo simplificado de desenvolvimento

```text
feature/*, refactor/* ou develop
        ↓
push normal da branch
        ↓
GitHub Actions testa e monta o site
        ↓
workflow sobrescreve a branch gerada gh-pages
        ↓
GitHub Pages publica gh-pages
        ↓
teste em aparelhos reais
        ↓
Pull Request e revisão
        ↓
merge na main
        ↓
Netlify produção
```

## Configuração única do GitHub Pages

O repositório deve ser configurado uma única vez em:

```text
Settings → Pages → Build and deployment
Source: Deploy from a branch
Branch: gh-pages
Folder: / (root)
```

Depois dessa configuração inicial, nenhuma branch de desenvolvimento precisa ser cadastrada em ambientes ou regras do Pages.

## Publicação automática

O workflow `.github/workflows/deploy-pages.yml` é acionado por push em:

- `feature/**`;
- `refactor/**`;
- `develop`.

O workflow:

1. faz checkout do SHA exato enviado;
2. valida a fundação modular, o PWA e a estrutura do aplicativo;
3. monta o artefato de desenvolvimento em `_site`;
4. executa os testes de navegador;
5. substitui automaticamente o conteúdo da branch `gh-pages` pelo artefato aprovado.

A branch `gh-pages` é gerada e não deve receber alterações manuais. Ela contém somente os arquivos estáticos publicados, incluindo `dev-build.json` com a branch e o commit de origem.

O GitHub Pages é um único ambiente. Portanto, o último push em uma branch de desenvolvimento válida substitui visualmente a versão anterior. Isso é intencional para este projeto de uma pessoa só.

O ambiente contém `robots.txt` com bloqueio de indexação e não deve armazenar segredos ou dados reais de usuários.

## Regra de clareza

Uma versão só pode ser considerada publicada quando:

- o workflow de publicação terminar verde;
- a branch `gh-pages` apontar para o artefato mais recente;
- `dev-build.json` e a identificação visual mostrarem a branch e o SHA esperados;
- o endereço do Pages abrir essa mesma versão.

Teste verde sem publicação não deve ser descrito como site disponível.

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
- GitHub Pages funcional e identificado com branch e SHA;
- teste manual em aparelho real quando a mudança afetar interface ou PWA;
- nenhuma credencial no repositório;
- migrações de dados testadas quando aplicável;
- plano de rollback para alterações de alto risco.
