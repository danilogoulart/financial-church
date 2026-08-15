import { APP_NAME, CHURCH_ADDRESS, CHURCH_FULL_NAME } from './brand'

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

const fmtDate = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('/') : '—')

// CSS do card. Usado tanto no PDF (janela isolada) quanto na prévia (shadow DOM),
// então não vaza para o resto do painel.
export const CREDENTIAL_CSS = `
  * { box-sizing: border-box; }
  /* Força a impressão dos fundos/cores (senão o header e a faixa saem em branco). */
  .card, .card * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
  .card {
    width: 100%; max-width: 380px; margin: 0 auto;
    font-family: Arial, Helvetica, sans-serif; color: #111;
    border: 1px solid #222; border-radius: 12px; overflow: hidden;
    background:
      linear-gradient(200deg, transparent 46%, rgba(0,156,59,.16) 48%, rgba(0,156,59,.16) 55%,
        rgba(255,223,0,.24) 55%, rgba(255,223,0,.24) 62%, transparent 64%),
      #fff;
  }
  .card-h { background: #000; color: #fff; display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
  .card-h img { height: 28px; }
  .card-h .n { font-size: 15px; font-weight: bold; letter-spacing: .3px; }
  .card-h .t { font-size: 11px; opacity: .85; }
  .body { display: flex; gap: 14px; padding: 12px 14px; align-items: flex-start; }
  .qr { margin-left: auto; text-align: center; }
  .qr img { width: 78px; height: 78px; display: block; }
  .qr span { font-size: 8px; color: #888; }
  .photo { width: 84px; height: 108px; object-fit: cover; border: 1px solid #ccc; border-radius: 6px; }
  .photo.ph { display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 11px; }
  .fields { font-size: 12px; min-width: 0; }
  .fields .name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
  .fields b { color: #666; font-weight: normal; }
  .obs { padding: 6px 14px; font-size: 10px; color: #666; font-style: italic; }
  .addr { padding: 2px 14px 8px; font-size: 9px; color: #888; text-align: center; }
  .sigs { display: flex; gap: 18px; padding: 4px 14px 16px; }
  .sig { flex: 1; text-align: center; }
  .sigimg { height: 36px; object-fit: contain; margin: 0 auto 2px; display: block; }
  .sigline { border-top: 1px solid #222; }
  .signame { font-size: 11px; font-weight: bold; margin-top: 3px; }
  .sigrole { font-size: 10px; color: #666; }
  .fullname { text-align: center; font-size: 10px; font-weight: bold; color: #333; padding: 6px 14px 0; }
`

// Markup do card da credencial (mesmo layout do PDF).
export function credentialCardHtml({ member, settings = {}, logoUrl, photoUrl, presSigUrl, secSigUrl, qr }) {
  const registro = member.matricula || String(member.id || '').slice(0, 8).toUpperCase()
  const desde = fmtDate(member.joined_date || member.created_at)

  const sig = (url, name, role) => `
    <div class="sig">
      ${url ? `<img src="${url}" class="sigimg">` : '<div class="sigimg"></div>'}
      <div class="sigline"></div>
      <div class="signame">${esc(name || '—')}</div>
      <div class="sigrole">${role}</div>
    </div>`

  return `<div class="card">
    <div class="card-h">
      ${logoUrl ? `<img src="${logoUrl}">` : ''}
      <div>
        <div class="n">${esc(APP_NAME)}</div>
        <div class="t">Credencial</div>
      </div>
    </div>

    <div class="body">
      ${photoUrl ? `<img class="photo" src="${photoUrl}">` : '<div class="photo ph">sem foto</div>'}
      <div class="fields">
        <div class="name">${esc(member.name)}</div>
        <div><b>Cargo:</b> ${esc(member.cargo || '—')}</div>
        <div><b>Matrícula:</b> ${esc(registro || '—')}</div>
        <div><b>Membro desde:</b> ${esc(desde || '—')}</div>
        <div><b>RG:</b> ${esc(member.rg || '—')}</div>
        <div><b>CPF:</b> ${esc(member.cpf || '—')}</div>
        <div><b>Nascimento:</b> ${esc(fmtDate(member.birth_date) || '—')}</div>
      </div>
      ${qr ? `<div class="qr"><img src="${qr}"><span>Validar</span></div>` : ''}
    </div>

    <div class="obs">Válida em todo o território nacional.</div>

    <div class="sigs">
      ${sig(presSigUrl, settings.president_name, 'Presidente')}
      ${sig(secSigUrl, settings.secretary_name, 'Secretário(a)')}
    </div>
    <div class="fullname">${esc(CHURCH_FULL_NAME)}</div>
    <div class="addr">${esc(CHURCH_ADDRESS)}</div>
  </div>`
}
