# DevProfile [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Descrição

O DevProfile é uma plataforma de perfil público para desenvolvedores, integrada ao GitHub, pensada para exibir presença profissional, métricas e conteúdo de forma elegante. Também inclui um painel administrativo protegido para gerenciar dados, links, projetos e outras informações do perfil.

## 🚀 Funcionalidades

- Integração com a API do GitHub para exibir dados públicos, repositórios e métricas de contribuição.
- Painel admin protegido por senha com autenticação baseada em bcrypt e sessão persistente.
- Gerenciamento de conteúdo com persistencia em KV via REST (Vercel Storage/Upstash Redis).
- Interface com tema claro/escuro usando `next-themes`.
- Experiências de drag and drop com `dnd-kit` para organizar conteúdos de forma intuitiva.
- SEO completo com `robots.txt`, `sitemap.xml` e imagem Open Graph.
- Estrutura pronta para exportação, backup e manutenção do conteúdo do perfil.

## 🧰 Tecnologias

| Tecnologia | Versão aproximada | Link oficial |
| --- | --- | --- |
| Next.js | 15.x | https://nextjs.org/ |
| React | 19.x | https://react.dev/ |
| TypeScript | 5.x | https://www.typescriptlang.org/ |
| Tailwind CSS | 4.x | https://tailwindcss.com/ |
| TanStack React Query | 5.x | https://tanstack.com/query/latest |
| @dnd-kit/core | 6.x | https://github.com/clauderic/dnd-kit |
| @dnd-kit/sortable | 10.x | https://github.com/clauderic/dnd-kit |
| @dnd-kit/utilities | 3.x | https://github.com/clauderic/dnd-kit |
| next-themes | 0.4.x | https://github.com/pacocoursey/next-themes |
| bcryptjs | 3.x | https://github.com/dcodeIO/bcrypt.js |
| Upstash Redis (REST) | Serviço gerenciado | https://upstash.com/docs/redis |

## 📋 Pré-requisitos

- Node.js 18+
- npm

## 🛠️ Instalação

```bash
git clone https://github.com/melloxyz/DevProfile.git
cd DevProfile
npm install
cp .env.example .env.local
npm run dev
```

## 🔐 Variáveis de ambiente

| Variável | Descrição | Obrigatório |
| --- | --- | --- |
| `NEXT_PUBLIC_GITHUB_USERNAME` | Usuário do GitHub exibido publicamente e usado nas consultas da API. | Não |
| `NEXT_PUBLIC_SITE_URL` | URL canônica da aplicação para metadados, sitemap e Open Graph. Use `https://devprofile.vercel.app` como referência. | Não |
| `GITHUB_TOKEN` | Token para autenticar chamadas à API do GitHub e reduzir limitações de rate limit. | Não |
| `ADMIN_ROUTE_SLUG` | Slug privado usado para acessar o painel administrativo. | Sim |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt da senha do administrador. | Sim |
| `ADMIN_SESSION_SECRET` | Segredo usado para assinar e validar a sessão administrativa. | Sim |
| `KV_REST_API_URL` | URL REST do KV/Redis. | Sim* |
| `KV_REST_API_TOKEN` | Token REST do KV/Redis. | Sim* |
| `UPSTASH_REDIS_REST_URL` | Alias aceito para URL REST do Upstash Redis. | Sim* |
| `UPSTASH_REDIS_REST_TOKEN` | Alias aceito para token REST do Upstash Redis. | Sim* |

\* Defina ao menos um par completo: `KV_REST_API_*` ou `UPSTASH_REDIS_REST_*`.

## ⚙️ Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `dev` | Inicia o ambiente de desenvolvimento com Turbopack. |
| `build` | Gera a build de produção da aplicação. |
| `start` | Executa a build compilada em ambiente de produção. |
| `lint` | Executa a validação de código com ESLint. |
| `type-check` | Executa a checagem estática de tipos com TypeScript. |
| `seed:kv` | Envia o snapshot local de `.data/dev-profile-content.json` para o KV remoto. |

## 🗂️ Estrutura de pastas

```text
.
├── .data/
│   └── dev-profile-content.json
├── public/
└── src/
    ├── app/
    ├── components/
    ├── config/
    ├── features/
    ├── hooks/
    ├── lib/
    └── types/
```

## 🚢 Deploy

A plataforma recomendada para deploy é a Vercel. Para o primeiro deploy:

1. Configure as variaveis de ambiente do projeto (incluindo o par de credenciais KV/Redis e os segredos admin).
2. Ajuste `NEXT_PUBLIC_SITE_URL` para a URL de producao.
3. Rode o seed inicial para preencher o KV com o snapshot atual:

```bash
npm run seed:kv
```

4. Faça o deploy na Vercel e valide o painel admin (login, edicao e backup).

## 🤝 Contribuindo

Contribuições são bem-vindas. Antes de abrir um PR, leia o guia em [CONTRIBUTING.md](CONTRIBUTING.md) para seguir o fluxo do projeto e manter a consistência das mudanças.

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
