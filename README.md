# SERVNET — Carteirinha de Associado

Portal responsivo para a carteirinha digital SERVNET, com API Node.js e banco PostgreSQL.

## Requisitos

- Node.js 18 ou superior e npm.
- Docker Desktop para iniciar PostgreSQL localmente, ou uma instância PostgreSQL acessível.

## Rodar localmente

1. Instale as dependências: `npm install`.
2. Copie `.env.example` para `.env` e configure uma senha administrativa forte e única.
3. Inicie o PostgreSQL local: `docker compose up -d db`.
4. Prepare as tabelas: `npm run migrate`.
5. Crie a conta inicial da TI/CPD: `npm run seed:admin`.
6. Em um terminal, inicie a API: `npm run start:api`.
7. Em outro, inicie o frontend: `npm run dev`.
8. Abra o endereço local mostrado pelo Vite, normalmente `http://localhost:5173`.

A tela oferece login separado para associado e equipe TI/CPD. A conta administrativa usa os valores definidos em `ADMIN_USERNAME` e `ADMIN_PASSWORD` no `.env`.

## Recursos do backend

- PostgreSQL armazena associados e administradores; matrícula é única.
- Senhas são armazenadas com Argon2id. O servidor nunca retorna o hash.
- Sessões server-side no PostgreSQL e cookie HTTP-only, SameSite=Lax; em produção o cookie exige HTTPS.
- Proteção CSRF para operações de escrita e limite de tentativas de login.
- Painel TI/CPD para cadastrar, editar, desativar e redefinir senhas.
- Importação CSV com as colunas `nome` e `matricula`; senhas provisórias aleatórias são geradas e baixadas uma única vez em um CSV separado.
- Registros de auditoria para ações administrativas.

## Segurança e implantação

Este repositório é público. O arquivo `.env` e segredos não devem ser enviados ao GitHub. Para produção, use PostgreSQL gerenciado, variáveis de ambiente protegidas, HTTPS e backups testados. Não use os valores de desenvolvimento do `docker-compose.yml` como credenciais de produção. Cadastre somente dados autorizados; o sistema guarda apenas nome, matrícula e hash de senha.

O protótipo visual de carteirinha usa dados ilustrativos no desenho de login. Não há associados reais incluídos no repositório.
