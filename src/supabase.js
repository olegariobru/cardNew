import { createClient } from '@supabase/supabase-js';

const projectUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(projectUrl && publishableKey && !projectUrl.includes('YOUR_PROJECT_REF') && !publishableKey.includes('YOUR_PUBLIC_KEY'));

// Apaga sessões persistidas por versões anteriores deste app neste navegador.
if (projectUrl && typeof window !== 'undefined') {
  try {
    const projectRef = new URL(projectUrl).hostname.split('.')[0];
    const legacyStorageKey = `sb-${projectRef}-auth-token`;
    window.sessionStorage.removeItem(legacyStorageKey);
    window.localStorage.removeItem(legacyStorageKey);
  } catch { /* Storage pode estar indisponível em alguns contextos do navegador. */ }
}

export const supabase = createClient(
  projectUrl || 'https://not-configured.supabase.co',
  publishableKey || 'not-configured',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function requireSupabaseConfig() {
  if (!isSupabaseConfigured) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.');
}

export async function memberAuthEmail(registration) {
  const normalized = registration.trim().toLocaleLowerCase('pt-BR');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `member-${hex.slice(0, 56)}@servnet.invalid`;
}

export async function callMemberManagement(body) {
  requireSupabaseConfig();
  const { data, error } = await supabase.functions.invoke('member-management', { body });
  if (!error) return data;
  let message = error.message || 'Não foi possível concluir a operação administrativa.';
  if (error.context instanceof Response) {
    try {
      const result = await error.context.json();
      if (result.error) message = result.error;
    } catch { /* Keep the SDK error message. */ }
  }
  throw new Error(message);
}

export async function logoutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function restoreCurrentUser() {
  requireSupabaseConfig();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await supabase.auth.signOut();
    return null;
  }
  const authUser = data.user;
  if (authUser.app_metadata?.role === 'admin') {
    return { id: authUser.id, email: authUser.email, role: 'admin' };
  }
  const { data: profile, error: profileError } = await supabase
    .from('member_profiles')
    .select('id, name, registration, active')
    .eq('id', authUser.id)
    .eq('active', true)
    .maybeSingle();
  if (profileError || !profile) {
    await supabase.auth.signOut();
    return null;
  }
  return { ...profile, role: 'member' };
}

export async function loginWithMemberCredentials(registration, password) {
  requireSupabaseConfig();
  const email = await memberAuthEmail(registration);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error('Matrícula ou senha incorreta.');
  const { data: profile, error: profileError } = await supabase
    .from('member_profiles')
    .select('id, name, registration, active')
    .eq('id', data.user.id)
    .eq('active', true)
    .maybeSingle();
  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error('Conta inativa ou não cadastrada. Procure a equipe de TI/CPD.');
  }
  return { ...profile, role: 'member' };
}

export async function loginWithAdminCredentials(email, password) {
  requireSupabaseConfig();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) throw new Error('E-mail ou senha da equipe incorretos.');
  if (data.user.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut();
    throw new Error('Esta conta não tem acesso ao painel TI/CPD.');
  }
  return { id: data.user.id, email: data.user.email, role: 'admin' };
}
