import { APP_NAME, CHURCH_ADDRESS, CHURCH_FULL_NAME } from './brand'

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

const fmtDate = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('/') : '—')

function validity() {
  const now = new Date()
  const until = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  const f = (dt) =>
    `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
  return { issued: f(now), until: f(until) }
}

// Abre uma janela de impressão com a credencial (imprime/salva como PDF).
export function printCredential({ member, settings, logoUrl, photoUrl, presSigUrl, secSigUrl }) {
  const registro = member.matricula || String(member.id || '').slice(0, 8).toUpperCase()
  const desde = fmtDate(member.joined_date || member.created_at)
  const { issued, until } = validity()

  const field = (label, value) => `<div><b>${label}</b> ${esc(value || '—')}</div>`

  const sig = (url, name, role) => `
    <div class="sig">
      ${url ? `<img src="${url}" class="sigimg">` : '<div class="sigimg"></div>'}
      <div class="sigline"></div>
      <div class="signame">${esc(name || '—')}</div>
      <div class="sigrole">${role}</div>
    </div>`

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Credencial — ${esc(member.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; display: flex; justify-content: center; padding: 24px; }
  .card { width: 380px; border: 1px solid #222; border-radius: 12px; overflow: hidden; }
  .card-h { background: #000; color: #fff; display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
  .card-h img { height: 28px; }
  .card-h .n { font-size: 15px; font-weight: bold; letter-spacing: .3px; }
  .card-h .t { font-size: 11px; opacity: .85; }
  .flag { height: 6px; display: flex; }
  .flag i { flex: 1; }
  .flag .g { background: #009c3b; }
  .flag .y { background: #ffdf00; }
  .fullname { text-align: center; font-size: 10px; color: #333; padding: 6px 14px 0; }
  .body { display: flex; gap: 14px; padding: 12px 14px; }
  .photo { width: 84px; height: 108px; object-fit: cover; border: 1px solid #ccc; border-radius: 6px; }
  .photo.ph { display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 11px; }
  .fields { font-size: 12px; }
  .fields .name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
  .fields b { color: #666; font-weight: normal; }
  .docs { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 14px; padding: 0 14px; font-size: 12px; }
  .docs b { color: #666; font-weight: normal; }
  .validity { padding: 8px 14px 0; font-size: 11px; color: #111; font-weight: bold; }
  .obs { padding: 4px 14px; font-size: 10px; color: #666; font-style: italic; }
  .addr { padding: 2px 14px 8px; font-size: 9px; color: #888; text-align: center; }
  .sigs { display: flex; gap: 18px; padding: 4px 14px 16px; }
  .sig { flex: 1; text-align: center; }
  .sigimg { height: 36px; object-fit: contain; margin: 0 auto 2px; display: block; }
  .sigline { border-top: 1px solid #222; }
  .signame { font-size: 11px; font-weight: bold; margin-top: 3px; }
  .sigrole { font-size: 10px; color: #666; }
  @media print { body { padding: 0; } }
</style></head>
<body onload="window.print()">
  <div class="card">
    <div class="card-h">
      ${logoUrl ? `<img src="${logoUrl}">` : ''}
      <div>
        <div class="n">${esc(APP_NAME)}</div>
        <div class="t">Credencial</div>
      </div>
    </div>
    <div class="flag"><i class="g"></i><i class="y"></i></div>
    <div class="fullname">${esc(CHURCH_FULL_NAME)}</div>

    <div class="body">
      ${photoUrl ? `<img class="photo" src="${photoUrl}">` : '<div class="photo ph">sem foto</div>'}
      <div class="fields">
        <div class="name">${esc(member.name)}</div>
        <div><b>Cargo:</b> ${esc(member.cargo || '—')}</div>
      </div>
    </div>

    <div class="docs">
      ${field('Matrícula:', registro)}
      ${field('Membro desde:', desde)}
      ${field('RG:', member.rg)}
      ${field('CPF:', member.cpf)}
      ${field('Nascimento:', fmtDate(member.birth_date))}
    </div>

    <div class="validity">Emitida em ${issued} · Válida até ${until}</div>
    <div class="obs">Válida em todo o território nacional.</div>
    <div class="addr">${esc(CHURCH_ADDRESS)}</div>

    <div class="sigs">
      ${sig(presSigUrl, settings.president_name, 'Presidente')}
      ${sig(secSigUrl, settings.secretary_name, 'Secretário(a)')}
    </div>
  </div>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para gerar a credencial.')
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
}
