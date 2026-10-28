import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle, Asterisk, ArrowRight, Check, CheckCircle2, ChevronDown, CircleHelp,
  CreditCard, Download, Eye, EyeOff, FileImage, KeyRound, Leaf, LockKeyhole,
  LogOut, Pencil, Plus, Search, Settings2, ShieldCheck, Trash2, Upload, UserRound, UsersRound, X,
} from 'lucide-react';
import './style.css';

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') {
    const tokenResponse = await fetch('/api/csrf', { credentials: 'same-origin' });
    if (!tokenResponse.ok) throw new Error('Não foi possível iniciar uma sessão segura.');
    headers['X-CSRF-Token'] = (await tokenResponse.json()).csrfToken;
  }
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a solicitação.');
  return result;
}

function IconBox({ children, className = '' }) {
  return <span className={className}>{children}</span>;
}

function BrandMark({ small = false, className = '' }) {
  return <div className={`brand-mark${small ? ' small' : ''} ${className}`}><Leaf aria-hidden="true" /></div>;
}

function Brand({ className = '' }) {
  return <div className={`brand ${className}`}><BrandMark /><span>SERVNET</span></div>;
}

function Toast({ toast }) {
  if (!toast) return <div className="toast" aria-live="polite" />;
  const Icon = toast.kind === 'error' ? AlertCircle : CheckCircle2;
  return <div className="toast show" role="status"><Icon aria-hidden="true" /><span>{toast.message}</span></div>;
}

function Modal({ title, children, onClose, icon: ModalIcon = CircleHelp, confirmLabel = 'Entendi' }) {
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="icon-button modal-close" aria-label="Fechar" onClick={onClose}><X /></button>
        <div className="modal-icon"><ModalIcon aria-hidden="true" /></div>
        <h2 id="modal-title">{title}</h2>
        {children}
        <button className="primary-button modal-ok" onClick={onClose}>{confirmLabel}</button>
      </section>
    </div>
  );
}

function ContactDetails({ help = false }) {
  return (
    <>
      <p className="modal-copy">{help
        ? 'Para solicitar uma troca de senha ou tirar dúvidas, procure a equipe de TI/CPD da associação.'
        : 'Entre em contato com a equipe de TI/CPD para receber uma senha temporária.'}</p>
      <div className="contact-card">
        {help ? <CircleHelp aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
        <div><strong>{help ? 'Atendimento ao associado' : 'Equipe de TI / CPD'}</strong><span>{help ? 'Equipe de Tecnologia / CPD' : 'Atendimento para associados'}</span></div>
      </div>
    </>
  );
}

function LoginScreen({ onLogin, onToast }) {
  const [showPassword, setShowPassword] = useState(false);
  const [modal, setModal] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = async event => {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const result = await apiRequest(adminMode ? '/api/auth/admin/login' : '/api/auth/member/login', {
        method: 'POST',
        body: adminMode
          ? { username: form.username.trim(), password: form.password }
          : { registration: form.username.trim(), password: form.password },
      });
      onLogin(result.user);
    } catch (error) {
      setFormError(error.message);
      onToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="login-shell">
      <div className="login-art">
        <div className="art-noise" />
        <div className="art-top"><Brand /><span className="portal-label">Portal do associado</span></div>
        <div className="art-content">
          <h1>Um lugar para<br />quem faz parte<span>.</span></h1>
          <p>Acesse sua carteirinha digital de associado com praticidade e segurança.</p>
          <div className="art-card-wrap">
            <div className="floating-card">
              <div className="mini-card-top"><BrandMark small /><div><strong>SERVNET</strong><small>Carteira de associado</small></div><span className="active-dot" /></div>
              <div className="mini-card-rule" /><small className="field-label">Associado</small><strong className="mini-name">Mariana Costa</strong>
              <div className="mini-card-bottom"><div><small className="field-label">Matrícula</small><strong>SN-20418</strong></div><div className="mini-seal"><ShieldCheck /></div></div>
            </div><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-spark"><Asterisk aria-hidden="true" /></div>
          </div>
        </div>
        <div className="art-footer"><span>Associação SERVNET</span><span>Desde 1998&nbsp; · &nbsp;Juntos somos mais</span></div>
      </div>
      <div className="login-panel">
        <div className="mobile-brand"><BrandMark /><span>SERVNET</span></div>
        <div className="login-form-wrap">
          <div className="welcome-icon"><UserRound /></div>
          <div className="form-heading"><h2>{adminMode ? 'Acesso da equipe' : 'Boas-vindas'}</h2><p>{adminMode ? 'Entre com sua conta administrativa da TI/CPD.' : 'Entre com seus dados para acessar sua carteirinha.'}</p></div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="registration">{adminMode ? 'Usuário da equipe' : 'Matrícula'}</label>
            <div className="input-wrap"><UserRound /><input id="registration" name="username" autoComplete="username" placeholder={adminMode ? 'Digite seu usuário' : 'Digite sua matrícula'} required aria-invalid={Boolean(formError)} aria-describedby={formError ? 'login-error' : undefined} value={form.username} onChange={event => { setFormError(''); setForm({ ...form, username: event.target.value }); }} /></div>
            <div className="label-row"><label htmlFor="password">Senha</label><button type="button" className="text-button" onClick={() => setModal(true)}>Esqueci minha senha</button></div>
            <div className="input-wrap"><LockKeyhole /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" required aria-invalid={Boolean(formError)} aria-describedby={formError ? 'login-error' : undefined} value={form.password} onChange={event => { setFormError(''); setForm({ ...form, password: event.target.value }); }} /><button className="show-pass" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
            {formError && <p className="login-error" id="login-error" role="alert">{formError}</p>}
            <button className="primary-button login-button" type="submit" disabled={busy}>{busy ? 'Verificando acesso…' : adminMode ? 'Entrar no painel' : 'Entrar na minha conta'} <ArrowRight /></button>
          </form>
          <div className="security-note"><ShieldCheck /><span>Seus dados são protegidos e acessíveis somente por você.</span></div>
          <div className="demo-note"><strong>{adminMode ? 'Acesso administrativo' : 'Acesso dos associados'}</strong><span>{adminMode ? 'Área exclusiva para equipe de TI/CPD.' : 'Use sua matrícula e senha cadastradas pela equipe.'}</span><button type="button" className="demo-admin-link" onClick={() => { setAdminMode(value => !value); setFormError(''); setForm({ username: '', password: '' }); }}>{adminMode ? 'Voltar ao acesso de associado' : 'Acesso da equipe TI/CPD'}</button></div>
        </div>
        <div className="login-help"><span>Precisa de ajuda?</span><button onClick={() => setModal(true)}>Fale com o CPD <ArrowRight /></button></div>
      </div>
      {modal && <Modal title="Solicitar troca de senha" icon={LockKeyhole} onClose={() => setModal(false)}><ContactDetails /></Modal>}
    </section>
  );
}

function MembershipCard({ member }) {
  return (
    <div className="membership-card" id="member-card">
      <div className="card-grain" /><div className="card-orbit card-orbit-a" /><div className="card-orbit card-orbit-b" />
      <div className="card-head"><div className="card-brand"><BrandMark className="card-logo" /><div><strong>SERVNET</strong><span>ASSOCIAÇÃO DE SERVIÇOS</span></div></div><div className="card-issued">IDENTIFICAÇÃO<br />DE ASSOCIADO</div></div>
      <div className="card-divider" /><div className="card-owner-label">ASSOCIADO(A)</div><div className="card-owner">{member.name}</div>
      <div className="card-foot"><div className="card-reg"><span>MATRÍCULA</span><strong>{member.registration}</strong></div><div className="card-auth"><ShieldCheck /><span>MEMBRO<br />SERVNET</span></div></div><div className="card-bottom-line" />
    </div>
  );
}

function downloadCard(member, format, onToast) {
  if (format === 'pdf') {
    const printable = window.open('', '_blank', 'width=900,height=620');
    if (!printable) return onToast('Permita a abertura de janela para gerar o PDF.', 'error');
    printable.document.write(`<!doctype html><html><head><title>Carteirinha SERVNET</title><style>@page{size:landscape;margin:18mm}body{margin:0;display:grid;place-items:center;min-height:100svh;font-family:Arial,sans-serif;background:#fff}.card{width:850px;height:520px;box-sizing:border-box;background:#30362d;border-radius:24px;color:white;padding:48px 56px;position:relative;overflow:hidden}.logo{width:50px;height:50px;border-radius:14px;background:#87976d;display:grid;place-items:center;color:#fff}.logo svg{width:30px;height:30px}.head{display:flex;align-items:center;gap:16px}.head strong{font-size:26px;letter-spacing:3px}.head small{display:block;font-size:10px;letter-spacing:2px;color:#c2c7b9;margin-top:5px}.label{font-size:10px;letter-spacing:2px;color:#c2c7b9;margin-top:78px}.name{font-size:32px;font-weight:700;margin-top:10px}.foot{display:flex;justify-content:space-between;align-items:end;margin-top:65px}.foot small{display:block;letter-spacing:2px;color:#c2c7b9;font-size:10px}.foot strong{font-size:24px;display:block;margin-top:8px}.kind{font-size:11px;letter-spacing:2px;border-radius:30px;padding:14px;background:#424b39}</style></head><body><div class="card"><div class="head"><div class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-6 8-9 16-9 0 8-3 16-9 16Z"/><path d="M8 16c2-2 5-4 9-6"/></svg></div><div><strong>SERVNET</strong><small>ASSOCIAÇÃO DE SERVIÇOS</small></div></div><div class="label">ASSOCIADO(A)</div><div class="name">${escapeHtml(member.name)}</div><div class="foot"><div><small>MATRÍCULA</small><strong>${escapeHtml(member.registration)}</strong></div><div class="kind">IDENTIFICAÇÃO DE ASSOCIADO</div></div></div><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
    printable.document.close();
    return;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720"><rect width="1200" height="720" rx="36" fill="#30362d"/><circle cx="1110" cy="640" r="300" fill="none" stroke="#9da788" stroke-opacity=".12" stroke-width="2"/><circle cx="1110" cy="640" r="220" fill="none" stroke="#9da788" stroke-opacity=".12" stroke-width="2"/><rect x="68" y="58" width="76" height="76" rx="20" fill="#87976d"/><path d="M106 120c-14-5-21-16-17-29 4-13 19-20 41-22-1 22-8 45-24 51Zm-8-18 23-20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="166" y="93" fill="white" font-family="Arial" font-size="32" font-weight="700" letter-spacing="5">SERVNET</text><text x="166" y="120" fill="#c2c7b9" font-family="Arial" font-size="14" letter-spacing="3">ASSOCIAÇÃO DE SERVIÇOS</text><text x="68" y="358" fill="#c2c7b9" font-family="Arial" font-size="15" letter-spacing="4">ASSOCIADO(A)</text><text x="68" y="414" fill="white" font-family="Arial" font-size="42" font-weight="700">${escapeXml(member.name)}</text><text x="68" y="565" fill="#c2c7b9" font-family="Arial" font-size="14" letter-spacing="4">MATRÍCULA</text><text x="68" y="610" fill="white" font-family="Arial" font-size="30" font-weight="700">${escapeXml(member.registration)}</text><text x="1125" y="608" fill="#e4e8da" font-family="Arial" font-size="14" text-anchor="end" letter-spacing="3">IDENTIFICAÇÃO DE ASSOCIADO</text></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 720;
    canvas.getContext('2d').drawImage(image, 0, 0);
    canvas.toBlob(png => {
      if (!png) return onToast('Não foi possível gerar a imagem.', 'error');
      const pngUrl = URL.createObjectURL(png); const link = document.createElement('a');
      link.href = pngUrl; link.download = `servnet-carteirinha-${member.registration}.png`; link.click();
      URL.revokeObjectURL(pngUrl);
    }, 'image/png');
    URL.revokeObjectURL(url);
  };
  image.onerror = () => { URL.revokeObjectURL(url); onToast('Não foi possível gerar a imagem.', 'error'); };
  image.src = url;
}

function escapeXml(value = '') {
  return String(value).replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);
}
function escapeHtml(value = '') { return escapeXml(value); }
function initials(name = '') { return name.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }

function Dashboard({ member, onLogout, onToast }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const firstName = member.name.split(' ')[0];
  return (
    <div className="app-layout" data-ui="member-card">
      <aside className="sidebar"><Brand className="sidebar-brand" /><div className="side-caption">ÁREA DO ASSOCIADO</div><button className="nav-item selected"><CreditCard /> Minha carteirinha</button>
        <div className="sidebar-bottom"><div className="sidebar-help"><CircleHelp /><div><strong>Precisa de ajuda?</strong><span>Fale com nossa equipe</span><button onClick={() => setHelpOpen(true)}>Entrar em contato <ArrowRight /></button></div></div>
          <div className="profile-row"><div className="avatar">{initials(member.name)}</div><div className="profile-text"><strong>{member.name}</strong><span>Associado SERVNET</span></div><button className="icon-button" aria-label="Sair" onClick={onLogout}><LogOut /></button></div></div>
      </aside>
      <div className="main-column"><header className="topbar"><div className="breadcrumb"><span>Portal do associado</span><ChevronDown /><strong>Minha carteirinha</strong></div><button className="mobile-exit" onClick={onLogout}><LogOut /> Sair</button><div className="top-status"><span className="status-dot" /> Conta ativa</div></header>
        <main className="dashboard-content"><div className="page-heading"><div><h1>Sua carteirinha digital</h1><p>Tenha sua identificação de associado sempre à mão.</p></div><div className="heading-spark" aria-hidden="true"></div></div>
          <div className="member-summary"><div className="summary-icon"><ShieldCheck /></div><div><strong>Olá, {firstName}!</strong><span>Sua carteirinha está pronta para você.</span></div><div className="summary-status"><span className="status-dot" /> ATIVA</div></div>
          <div className="card-section-header"><div><h2>Identificação de associado</h2><p>Visualize ou salve sua carteirinha para usar quando precisar.</p></div><div className="format-chip"><Check /> Digital</div></div>
          <MembershipCard member={member} />
          <div className="card-actions"><button className="primary-button" onClick={() => downloadCard(member, 'pdf', onToast)}><Download /> Baixar carteirinha <span className="button-format">PDF</span></button><button className="secondary-button" onClick={() => downloadCard(member, 'png', onToast)}><FileImage /> Salvar como imagem</button></div>
          <div className="privacy-note"><LockKeyhole /><p><strong>Seu acesso é pessoal</strong><span>Entre com sua matrícula e senha sempre que quiser consultar sua carteirinha.</span></p><span className="note-status"><Check /> PROTEGIDO</span></div>
          <footer className="dashboard-footer"><span>© 2025 SERVNET · ASSOCIAÇÃO DE SERVIÇOS</span><span>Conexão que fortalece.</span></footer>
        </main>
      </div>
      {helpOpen && <Modal title="Fale com a equipe de TI/CPD" icon={CircleHelp} onClose={() => setHelpOpen(false)}><ContactDetails help /></Modal>}
    </div>
  );
}

function MemberFormModal({ existing, onSave, onClose, busy }) {
  const [form, setForm] = useState(existing || { name: '', registration: '', password: '' });
  const submit = event => {
    event.preventDefault();
    onSave({ name: form.name.trim(), registration: form.registration.trim(), password: form.password || undefined });
  };
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal member-modal" role="dialog" aria-modal="true" aria-labelledby="member-modal-title">
        <button className="icon-button modal-close" aria-label="Fechar" onClick={onClose}><X /></button><div className="modal-icon"><UserRound /></div>
        <h2 id="member-modal-title">{existing ? 'Editar associado' : 'Novo associado'}</h2><p className="modal-copy">Cadastre o nome e a matrícula que serão exibidos na carteirinha.</p>
        <form onSubmit={submit}><label htmlFor="member-name">Nome completo</label><div className="input-wrap"><UserRound /><input id="member-name" required value={form.name} placeholder="Nome do associado" onChange={event => setForm({ ...form, name: event.target.value })} /></div>
          <label htmlFor="member-reg">Matrícula</label><div className="input-wrap"><CreditCard /><input id="member-reg" required readOnly={Boolean(existing)} value={form.registration} placeholder="Ex.: SN-20419" onChange={event => setForm({ ...form, registration: event.target.value })} /></div>
          {!existing && <><label htmlFor="member-password">Senha inicial (opcional)</label><div className="input-wrap"><LockKeyhole /><input id="member-password" type="password" autoComplete="new-password" value={form.password} placeholder="Em branco: o sistema gera uma senha" onChange={event => setForm({ ...form, password: event.target.value })} /></div></>}
          <button className="primary-button modal-ok" type="submit" disabled={busy}>{busy ? 'Salvando…' : existing ? 'Salvar alterações' : 'Cadastrar associado'}</button>
        </form>
      </section>
    </div>
  );
}

function MemberRows({ members, searchText, onEdit, onDelete, onReset }) {
  const rows = members.filter(member => `${member.name} ${member.registration}`.toLowerCase().includes(searchText.toLowerCase()));
  if (!rows.length) return <tr><td colSpan="4" className="empty-row">Nenhum associado encontrado.</td></tr>;
  return rows.map(member => <tr key={member.registration}>
    <td className="member-identity"><div className="table-person"><div className="table-avatar">{initials(member.name)}</div><div><strong>{member.name}</strong><span>Associado SERVNET</span></div></div></td>
    <td className="member-registration" data-label="Matrícula"><span className="registration-pill">{member.registration}</span></td><td className="member-access" data-label="Acesso"><span className={`table-access${member.active ? '' : ' inactive'}`}><i /> {member.active ? 'Ativo' : 'Desativado'}</span></td>
    <td className="member-actions"><div className="row-actions"><button className="icon-button" title="Editar" aria-label={`Editar ${member.name}`} onClick={() => onEdit(member)}><Pencil /></button>{member.active && <><button className="icon-button" title="Redefinir senha" aria-label={`Redefinir senha de ${member.name}`} onClick={() => onReset(member)}><KeyRound /></button><button className="icon-button" title="Desativar acesso" aria-label={`Desativar acesso de ${member.name}`} onClick={() => onDelete(member)}><Trash2 /></button></>}</div></td>
  </tr>);
}

function AdminPanel({ admin, onLogout, onToast }) {
  const [members, setMembers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalMember, setModalMember] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showCardInfo, setShowCardInfo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true);
    apiRequest(`/api/admin/members?search=${encodeURIComponent(searchText)}`)
      .then(result => { if (current) setMembers(result.members); })
      .catch(error => { if (current) onToast(error.message, 'error'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [searchText, onToast]);

  const saveMember = async member => {
    setBusy(true);
    try {
      if (modalMember) {
        const result = await apiRequest(`/api/admin/members/${modalMember.id}`, { method: 'PATCH', body: { name: member.name, active: modalMember.active } });
        setMembers(current => current.map(item => item.id === result.member.id ? result.member : item));
        onToast('Cadastro atualizado.');
      } else {
        const result = await apiRequest('/api/admin/members', { method: 'POST', body: member });
        setMembers(current => [...current, result.member].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
        onToast(result.temporaryPassword ? `Associado cadastrado. Senha provisória: ${result.temporaryPassword}` : 'Associado cadastrado.');
      }
      setShowMemberForm(false);
      setModalMember(null);
    } catch (error) {
      onToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async member => {
    try {
      const result = await apiRequest(`/api/admin/members/${member.id}`, { method: 'PATCH', body: { name: member.name, active: false } });
      setMembers(current => current.map(item => item.id === result.member.id ? result.member : item));
      onToast('Acesso do associado desativado.');
    } catch (error) {
      onToast(error.message, 'error');
    }
  };

  const resetPassword = async member => {
    try {
      const result = await apiRequest(`/api/admin/members/${member.id}/reset-password`, { method: 'POST', body: {} });
      onToast(`Nova senha provisória de ${member.registration}: ${result.temporaryPassword}`);
    } catch (error) {
      onToast(error.message, 'error');
    }
  };

  const importCsv = event => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean); if (!lines.length) return;
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map(value => value.trim().toLowerCase().replace(/^"|"$/g, ''));
      const nameIndex = headers.findIndex(value => ['nome', 'name'].includes(value));
      const registrationIndex = headers.findIndex(value => ['matricula', 'matrícula', 'registration'].includes(value));
      if (nameIndex < 0 || registrationIndex < 0) return onToast('CSV precisa ter colunas nome e matricula.', 'error');
      const imported = lines.slice(1).map(line => {
        const cells = line.split(separator).map(value => value.trim().replace(/^"|"$/g, ''));
        return { name: cells[nameIndex], registration: cells[registrationIndex] };
      }).filter(item => item.name && item.registration);
      setBusy(true);
      try {
        const result = await apiRequest('/api/admin/members/import', { method: 'POST', body: { members: imported } });
        const csvCell = value => `"${String(value).replaceAll('"', '""')}"`;
        const rows = [['nome', 'matricula', 'senha_temporaria'], ...result.members.map(item => [item.name, item.registration, item.temporaryPassword])];
        const csv = rows.map(row => row.map(csvCell).join(';')).join('\r\n');
        const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = 'servnet-acessos-temporarios.csv'; link.click(); URL.revokeObjectURL(url);
        setMembers(current => [...current, ...result.members].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
        onToast(`${result.members.length} associado(s) importado(s). Baixe o CSV de senhas provisórias e entregue-as diretamente aos associados.`);
      } catch (error) {
        onToast(error.message, 'error');
      } finally {
        setBusy(false);
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="admin-layout" data-ui="member-list"><aside className="sidebar admin-sidebar"><Brand className="sidebar-brand" /><div className="side-caption">PAINEL DE GESTÃO</div><button className="nav-item selected"><UsersRound /> Associados</button><button className="nav-item" onClick={() => setShowCardInfo(true)}><CreditCard /> Modelo da carteirinha</button>
      <div className="sidebar-bottom"><div className="sidebar-help"><Settings2 /><div><strong>Área restrita</strong><span>Equipe de TI / CPD</span><button onClick={onLogout}>Sair do painel <ArrowRight /></button></div></div><div className="profile-row"><div className="avatar admin-avatar">TI</div><div className="profile-text"><strong>{admin.username}</strong><span>Administrador SERVNET</span></div><button className="icon-button" aria-label="Sair do painel" onClick={onLogout}><LogOut /></button></div></div>
    </aside><div className="admin-main"><header className="topbar"><div className="breadcrumb"><span>Gestão</span><ChevronDown /><strong>Associados</strong></div><button className="mobile-exit admin-mobile-exit" onClick={onLogout}><LogOut /> Sair</button><div className="top-status admin-status"><LockKeyhole /> Área autenticada</div></header>
      <main className="admin-content"><div className="page-heading admin-heading"><div><h1>Associados</h1><p>Gerencie os acessos à carteirinha digital.</p></div><button className="primary-button" onClick={() => { setModalMember(null); setShowMemberForm(true); }}><Plus /> Novo associado</button></div>
        <div className="stats-row"><div className="stat-card"><div className="stat-icon"><UsersRound /></div><div><span>Total de associados</span><strong>{members.length}</strong></div><div className="stat-caption">encontrados</div></div><div className="stat-card"><div className="stat-icon green"><CreditCard /></div><div><span>Acessos ativos</span><strong>{members.filter(member => member.active).length}</strong></div><div className="stat-caption">carteirinhas</div></div></div>
        <section className="members-panel"><div className="members-panel-head"><div><h2>Lista de associados</h2><p>Consulte e mantenha os dados de acesso organizados.</p></div><button className="secondary-button import-button" onClick={() => document.querySelector('#csv-file')?.click()}><Upload /> Importar planilha</button><input type="file" id="csv-file" accept=".csv,text/csv" hidden onChange={importCsv} /></div>
          <div className="table-toolbar"><div className="search-wrap"><Search /><input aria-label="Buscar por nome ou matrícula" placeholder="Buscar por nome ou matrícula" value={searchText} onChange={event => setSearchText(event.target.value)} /></div><span className="results-count">{loading ? 'Carregando…' : `${members.length} registros`}</span></div>
          <div className="table-wrap"><table><thead><tr><th>Associado</th><th>Matrícula</th><th>Acesso</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="empty-row">Carregando associados…</td></tr> : <MemberRows members={members} searchText={searchText} onEdit={member => { setModalMember(member); setShowMemberForm(true); }} onDelete={removeMember} onReset={resetPassword} />}</tbody></table></div>
          <div className="panel-foot"><CircleHelp /> Dados importados aceitam CSV com as colunas <strong>nome</strong> e <strong>matricula</strong>.</div>
        </section><footer className="dashboard-footer"><span>© 2025 SERVNET · PAINEL ADMINISTRATIVO</span><span>Equipe de Tecnologia / CPD</span></footer>
      </main></div>
      {showMemberForm && <MemberFormModal existing={modalMember} onSave={saveMember} busy={busy} onClose={() => setShowMemberForm(false)} />}
      {showCardInfo && <Modal title="Modelo da carteirinha" onClose={() => setShowCardInfo(false)}><p className="modal-copy">O modelo de teste está ativo. Quando você tiver o arquivo oficial, poderá substituir este placeholder e ajustar a posição dos dados.</p></Modal>}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const sendToast = useCallback((message, kind = 'success') => setToast({ message, kind }), []);
  useEffect(() => {
    let current = true;
    apiRequest('/api/auth/me')
      .then(result => { if (current) setUser(result.user); })
      .catch(() => { if (current) setUser(null); })
      .finally(() => { if (current) setAuthLoading(false); });
    return () => { current = false; };
  }, []);

  const logout = useCallback(async () => {
    try { await apiRequest('/api/auth/logout', { method: 'POST' }); } catch (error) { sendToast(error.message, 'error'); }
    setUser(null);
  }, [sendToast]);

  React.useEffect(() => {
    document.body.className = user ? 'app-body' : 'login-body';
  }, [user]);

  let screen;
  if (authLoading) screen = <div className="auth-loading" role="status">Carregando acesso seguro…</div>;
  else if (user?.role === 'admin') screen = <AdminPanel admin={user} onLogout={logout} onToast={sendToast} />;
  else if (user?.role === 'member') screen = <Dashboard member={user} onLogout={logout} onToast={sendToast} />;
  else screen = <LoginScreen onLogin={setUser} onToast={sendToast} />;

  return <div className="font-servnet">{screen}<Toast toast={toast} /></div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
