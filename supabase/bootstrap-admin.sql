-- 1. Crie a conta da equipe em Supabase Dashboard > Authentication > Users.
-- 2. Troque o e-mail de exemplo abaixo pelo e-mail exato dessa conta e execute no SQL Editor.
-- 3. Saia e entre novamente no portal para receber o papel administrativo no token.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'troque-pelo-email-do-cpd@example.com';
