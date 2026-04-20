# Contribuindo para o DevProfile

Obrigado por considerar contribuir com o DevProfile. Este projeto valoriza melhorias bem documentadas, consistência visual e código fácil de manter.

## Como reportar bugs

1. Verifique se o problema já foi reportado nas issues existentes.
2. Se ainda não houver um relato semelhante, abra uma nova issue.
3. Descreva com clareza o comportamento esperado e o comportamento atual.
4. Inclua a versão do Node.js, o sistema operacional e, se possível, prints ou gravações de tela.

## Como sugerir melhorias

Abra uma issue com a label `enhancement` e explique:

- qual problema a melhoria resolve;
- qual solução você imagina;
- quais impactos a mudança pode ter na experiência do usuário.

## Fluxo de desenvolvimento

1. Faça um fork do repositório no GitHub.
2. Clone o fork na sua máquina.
3. Crie uma branch seguindo o padrão do tipo de trabalho.

```bash
git clone https://github.com/<seu-usuario>/DevProfile.git
cd DevProfile
git remote add upstream https://github.com/melloxyz/DevProfile.git
git checkout -b feat/nome-da-feature
```

```bash
# Outros exemplos de branch
git checkout -b fix/nome-do-bug
git checkout -b docs/nome-da-doc
```

4. Instale as dependências.

```bash
npm install
```

5. Configure o arquivo de ambiente local.

```bash
cp .env.example .env.local
```

6. Rode a aplicação em modo de desenvolvimento.

```bash
npm run dev
```

## Padrões de código

- Use TypeScript em modo estrito e evite `any` explícito.
- Siga a configuração atual de ESLint executando `npm run lint`.
- Execute `npm run type-check` antes de commitar.

## Padrão de commits

Use Conventional Commits para manter o histórico consistente.

```bash
feat: adiciona novo cartão de métricas
fix: corrige validação do login do admin
docs: atualiza README com instruções de deploy
style: ajusta espaçamento do layout
refactor: simplifica lógica de persistência
test: cobre fluxo de autenticação
chore: atualiza dependências
```

## Abrindo um Pull Request

- Abra o PR a partir de uma branch criada a partir de `main`.
- Use um título claro e descreva objetivamente o que foi alterado.
- Relacione a issue correspondente com `Closes #número`.
- Aguarde o review antes de fazer merge.

## Dúvidas

Se restar alguma dúvida, abra uma issue com a label `question` e descreva o contexto com o máximo de detalhes possível.
