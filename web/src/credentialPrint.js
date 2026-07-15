import { APP_NAME } from './brand'

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

// Abre uma janela de impressão com a credencial (imprime/salva como PDF).
export function printCredential({ member, settings, logoUrl, photoUrl, presSigUrl, secSigUrl, title }) {
  const ministries = (member.ministries || []).join(', ') || '—'
  const registro = String(member.id || '').slice(0, 8).toUpperCase()
  const desde = member.created_at
    ? member.created_at.slice(0, 10).split('-').reverse().join('/')
    : ''

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
  .card { width: 340px; border: 1px solid #222; border-radius: 12px; overflow: hidden; }
  .card-h { background: #000; color: #fff; display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
  .card-h img { height: 24px; }
  .card-h .n { font-size: 14px; font-weight: bold; letter-spacing: .3px; }
  .card-h .t { font-size: 11px; opacity: .85; }
  .body { display: flex; gap: 14px; padding: 14px; }
  .photo { width: 84px; height: 108px; object-fit: cover; border: 1px solid #ccc; border-radius: 6px; }
  .photo.ph { display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 11px; }
  .fields { font-size: 12px; }
  .fields .name { font-size: 16px; font-weight: bold; margin-bottom: 6px; }
  .fields div { margin: 2px 0; }
  .fields b { color: #666; font-weight: normal; }
  .sigs { display: flex; gap: 18px; padding: 6px 14px 16px; }
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
        <div class="t">${esc(title)}</div>
      </div>
    </div>
    <div class="body">
      ${photoUrl ? `<img class="photo" src="${photoUrl}">` : '<div class="photo ph">sem foto</div>'}
      <div class="fields">
        <div class="name">${esc(member.name)}</div>
        <div><b>Cargo:</b> ${esc(member.cargo || '—')}</div>
        <div><b>Ministérios:</b> ${esc(ministries)}</div>
        <div><b>Registro:</b> ${registro}</div>
        <div><b>Membro desde:</b> ${desde}</div>
      </div>
    </div>
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
