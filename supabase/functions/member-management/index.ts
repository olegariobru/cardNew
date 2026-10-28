import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const emailForRegistration = async (registration: string) => {
  const normalized = registration.trim().toLocaleLowerCase('pt-BR');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `member-${hex.slice(0, 56)}@servnet.invalid`;
};

const temporaryPassword = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const validName = (value: unknown): value is string => typeof value === 'string' && value.trim().replace(/\s+/g, ' ').length >= 2 && value.trim().length <= 160;
const validRegistration = (value: unknown): value is string => typeof value === 'string' && /^[\p{L}\p{N}._/-]{2,32}$/u.test(value.trim());
const safeMember = (row: any) => ({ id: row.id, name: row.name, registration: row.registration, active: row.active, createdAt: row.created_at });

Deno.serve(async request => {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (Deno.env.get('SERVNET_ALLOWED_ORIGINS') || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(value => value.trim()).filter(Boolean);
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : '';
  const reply = (body: unknown, status = 200) => jsonResponse(body, status, allowedOrigin || 'null');
  if (origin && !allowedOrigin) return reply({ error: 'Origem não autorizada.' }, 403);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Origin': allowedOrigin || 'null' } });
  if (request.method !== 'POST') return reply({ error: 'Método não permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !serviceKey || !authorization) {
    return reply({ error: 'A função não está configurada corretamente.' }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authResult, error: authError } = await userClient.auth.getUser();
  const actor = authResult.user;
  if (authError || !actor) return reply({ error: 'Sessão inválida. Entre novamente.' }, 401);
  if (actor.app_metadata?.role !== 'admin') return reply({ error: 'Acesso restrito à equipe TI/CPD.' }, 403);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return reply({ error: 'Corpo da solicitação inválido.' }, 400);
  }

  const audit = async (action: string, memberId: string | null = null) => {
    await admin.from('admin_audit_log').insert({ admin_id: actor.id, action, member_id: memberId });
  };

  try {
    if (body.action === 'list') {
      const { data, error } = await admin.from('member_profiles')
        .select('id, name, registration, active, created_at')
        .order('name', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return reply({ members: (data || []).map(safeMember) });
    }

    if (body.action === 'create') {
      if (!validName(body.name) || !validRegistration(body.registration)) return reply({ error: 'Nome ou matrícula inválidos.' }, 400);
      const name = body.name.trim().replace(/\s+/g, ' ');
      const registration = body.registration.trim();
      const password = typeof body.password === 'string' && body.password ? body.password : temporaryPassword();
      if (password.length < 12 || password.length > 256) return reply({ error: 'A senha provisória precisa ter pelo menos 12 caracteres.' }, 400);
      const email = await emailForRegistration(registration);
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: 'member' },
      });
      if (createError || !created.user) {
        if (createError?.message.toLowerCase().includes('already')) return reply({ error: 'Essa matrícula já está cadastrada.' }, 409);
        throw createError || new Error('Não foi possível criar o acesso.');
      }
      const { data: profile, error: profileError } = await admin.from('member_profiles')
        .insert({ id: created.user.id, name, registration })
        .select('id, name, registration, active, created_at')
        .single();
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        if (profileError.code === '23505') return reply({ error: 'Essa matrícula já está cadastrada.' }, 409);
        throw profileError;
      }
      await audit('member.created', profile.id);
      return reply({ member: safeMember(profile), temporaryPassword: body.password ? undefined : password }, 201);
    }

    if (body.action === 'update') {
      if (typeof body.id !== 'string' || !validName(body.name)) return reply({ error: 'Dados inválidos para atualizar o associado.' }, 400);
      const { data, error } = await admin.from('member_profiles')
        .update({ name: body.name.trim().replace(/\s+/g, ' '), updated_at: new Date().toISOString() })
        .eq('id', body.id)
        .select('id, name, registration, active, created_at')
        .maybeSingle();
      if (error) throw error;
      if (!data) return reply({ error: 'Associado não encontrado.' }, 404);
      await audit('member.updated', data.id);
      return reply({ member: safeMember(data) });
    }

    if (body.action === 'set_active') {
      if (typeof body.id !== 'string' || typeof body.active !== 'boolean') return reply({ error: 'Dados inválidos.' }, 400);
      const { data, error } = await admin.from('member_profiles')
        .update({ active: body.active, updated_at: new Date().toISOString() })
        .eq('id', body.id)
        .select('id, name, registration, active, created_at')
        .maybeSingle();
      if (error) throw error;
      if (!data) return reply({ error: 'Associado não encontrado.' }, 404);
      await audit(body.active ? 'member.activated' : 'member.deactivated', data.id);
      return reply({ member: safeMember(data) });
    }

    if (body.action === 'reset_password') {
      if (typeof body.id !== 'string') return reply({ error: 'Identificador inválido.' }, 400);
      const { data: profile, error: profileError } = await admin.from('member_profiles')
        .select('id, registration, active')
        .eq('id', body.id)
        .eq('active', true)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return reply({ error: 'Associado ativo não encontrado.' }, 404);
      const password = temporaryPassword();
      const { error } = await admin.auth.admin.updateUserById(profile.id, { password });
      if (error) throw error;
      await audit('member.password_reset', profile.id);
      return reply({ temporaryPassword: password });
    }

    if (body.action === 'import') {
      if (!Array.isArray(body.members) || body.members.length < 1 || body.members.length > 1000) {
        return reply({ error: 'Envie entre 1 e 1.000 associados.' }, 400);
      }
      const seen = new Set<string>();
      const rows: Array<{ name: string; registration: string }> = [];
      for (const [index, item] of body.members.entries()) {
        if (!validName(item?.name) || !validRegistration(item?.registration)) return reply({ error: `Dados inválidos na linha ${index + 1}.` }, 400);
        const registration = item.registration.trim();
        const normalized = registration.toLocaleLowerCase('pt-BR');
        if (seen.has(normalized)) return reply({ error: `Matrícula repetida no arquivo: ${registration}.` }, 409);
        seen.add(normalized);
        rows.push({ name: item.name.trim().replace(/\s+/g, ' '), registration });
      }

      const created: Array<{ id: string; name: string; registration: string; active: boolean; createdAt: string; temporaryPassword: string }> = [];
      try {
        for (const row of rows) {
          const password = temporaryPassword();
          const email = await emailForRegistration(row.registration);
          const { data: account, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            app_metadata: { role: 'member' },
          });
          if (createError || !account.user) {
            if (createError?.message.toLowerCase().includes('already')) throw new Error(`Matrícula já cadastrada: ${row.registration}.`);
            throw createError || new Error(`Não foi possível criar ${row.registration}.`);
          }
          const { data: profile, error: profileError } = await admin.from('member_profiles')
            .insert({ id: account.user.id, name: row.name, registration: row.registration })
            .select('id, name, registration, active, created_at')
            .single();
          if (profileError) {
            await admin.auth.admin.deleteUser(account.user.id);
            if (profileError.code === '23505') throw new Error(`Matrícula já cadastrada: ${row.registration}.`);
            throw profileError;
          }
          created.push({ ...safeMember(profile), temporaryPassword: password });
        }
      } catch (error) {
        for (const member of created) {
          await admin.from('member_profiles').delete().eq('id', member.id);
          await admin.auth.admin.deleteUser(member.id);
        }
        throw error;
      }
      for (const member of created) await audit('member.imported', member.id);
      return reply({ members: created }, 201);
    }

    return reply({ error: 'Ação administrativa desconhecida.' }, 400);
  } catch (error) {
    console.error('member-management error:', error?.message || error);
    return reply({ error: 'Falha ao concluir a operação. Consulte os logs da Edge Function.' }, 500);
  }
});
