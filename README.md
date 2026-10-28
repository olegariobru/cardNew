# SERVNET — Carteirinha de Associado

Portal responsivo para a carteirinha SERVNET. Esta branch usa Supabase Auth, PostgreSQL gerenciado pelo Supabase, políticas RLS e uma Edge Function para as operações administrativas.

A implementação alternativa com PostgreSQL próprio está preservada na branch `backend-postgresql` deste repositório.

## Requisitos

- Node.js 18 ou superior e npm.
- Um projeto Supabase para teste.

## Configurar o Supabase

1. Crie um projeto no Supabase e copie a URL do projeto e a **publishable key**.
2. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. No SQL Editor do Supabase, execute `supabase/migrations/20261028000000_servnet.sql`.
4. Em Authentication settings, desative novos cadastros públicos. Contas de associados serão criadas pela TI/CPD.
5. Crie uma conta administrativa em Authentication > Users e execute `supabase/bootstrap-admin.sql`, substituindo o e-mail de exemplo. Saia e entre no portal de novo.
6. Instale/execute a Supabase CLI, faça `npx supabase login`, `npx supabase link --project-ref <REF_DO_PROJETO>` e `npx supabase functions deploy member-management`. A configuração mantém `verify_jwt = true`. O projeto fornece a URL e a chave de serviço à função; não coloque essa chave no `.env` do frontend.
7. Para testar no endereço padrão do Vite, a função já aceita `http://localhost:5173` e `http://127.0.0.1:5173`. Em outra origem, configure a allowlist, por exemplo: `npx supabase secrets set SERVNET_ALLOWED_ORIGINS=https://seu-dominio.example`.

## Executar localmente

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite, normalmente `http://localhost:5173`. O associado entra com matrícula e senha. A TI/CPD entra com e-mail administrativo e senha.

## Operações disponíveis

- Associado consulta apenas o próprio perfil e a carteirinha.
- TI/CPD cadastra, edita, desativa e reativa associados, redefinindo a senha quando necessário.
- Importação CSV com cabeçalhos `nome` e `matricula`; o sistema gera senhas provisórias e baixa um CSV para entrega direta aos associados.
- Ações administrativas registradas na tabela `admin_audit_log`.

## Segurança

O frontend usa somente a publishable key, que pode ser pública quando RLS e os privilégios SQL estão configurados corretamente. A chave de serviço tem acesso privilegiado e fica somente nas Edge Functions. Não adicione chaves secretas nem dados reais a este repositório público.

O Supabase fornece autenticação e armazenamento de senhas com hash. O perfil guarda nome, matrícula e estado ativo; não guarda senha. RLS restringe cada associado ao próprio perfil. A equipe é autorizada pelo `app_metadata.role`, que o usuário não pode alterar pelo cliente. O protótipo visual ainda contém um nome e matrícula ilustrativos na arte da tela de login.

Para produção, revise as políticas no Supabase, use senhas fortes para contas administrativas e habilite MFA para a equipe de TI/CPD. Ative backups conforme o plano e valide o procedimento de restauração antes de cadastrar associados reais.
