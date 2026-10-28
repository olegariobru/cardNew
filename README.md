# SERVNET — Carteirinha de Associado

Protótipo demonstrativo de um portal responsivo para associados da SERVNET.

## Executar localmente

Requisitos: Node.js 18 ou superior e npm.

```bash
npm install
npm run dev
```

Abra no navegador o endereço informado pelo Vite (normalmente `http://localhost:5173`).

## Acesso de demonstração

- Matrícula: `SN-20418`
- Senha: `servnet2025`

Na tela de login, use **Abrir painel CPD de demonstração** para acessar a área administrativa.

## O que o protótipo demonstra

- Interface responsiva para login e consulta à carteirinha.
- Visualização e exportação da carteirinha.
- Painel CPD de demonstração com cadastro, edição, remoção, busca e importação CSV.
- Persistência dos cadastros apenas no armazenamento local do navegador.

## Limitações importantes

Este repositório contém somente um protótipo de interface. Não há servidor, banco de dados compartilhado nem autenticação segura. O painel CPD não é protegido por login. Não use dados pessoais reais nem as credenciais de demonstração em produção. Antes de atender associados reais, será necessário implementar backend, banco de dados, autenticação e controle de acesso seguros. Logotipo e modelo da carteirinha são placeholders.
